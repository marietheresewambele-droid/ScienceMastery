"use client";

import { useEffect, useState } from "react";
import { markDirty } from "@/lib/sync";
import type { Subject } from "@/types/questions";

export type CourseTier = "Higher" | "Foundation";
export type CoursePathway = "triple" | "combined";

/** A course the student has added, e.g. Physics - GCSE - AQA - Triple - Higher. */
export interface Course {
  id: string;
  qualification: "GCSE";
  subject: Subject;
  board: "AQA";
  pathway: CoursePathway;
  tier: CourseTier;
}

const STORAGE_KEY = "sciencemastery_courses_v1";
const EVENT = "sciencemastery:courses-updated";

export const SUBJECT_NAMES: Record<Subject, string> = { biology: "Biology", chemistry: "Chemistry", physics: "Physics" };
export const PATHWAY_NAMES: Record<CoursePathway, string> = { triple: "Triple", combined: "Combined" };

export const courseId = (course: Omit<Course, "id">) =>
  [course.qualification, course.subject, course.board, course.pathway, course.tier].join("-").toLowerCase();

export const courseLabel = (course: Course) =>
  `${course.qualification} - ${course.board} - ${PATHWAY_NAMES[course.pathway]} - ${course.tier}`;

export function readCourses(): Course[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((course): course is Course =>
      course && typeof course.id === "string" && course.subject in SUBJECT_NAMES
      && (course.pathway === "triple" || course.pathway === "combined")
      && (course.tier === "Higher" || course.tier === "Foundation"));
  } catch {
    return [];
  }
}

function writeCourses(courses: Course[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
    markDirty(STORAGE_KEY);
    window.dispatchEvent(new Event(EVENT));
  } catch { /* storage unavailable */ }
}

export function addCourse(course: Omit<Course, "id">): Course {
  const saved = { ...course, id: courseId(course) };
  const courses = readCourses();
  if (!courses.some((existing) => existing.id === saved.id)) writeCourses([...courses, saved]);
  return saved;
}

export function removeCourse(id: string) {
  writeCourses(readCourses().filter((course) => course.id !== id));
}

/** The student's courses, kept in step with additions made anywhere in the app. */
export function useCourses(): { courses: Course[]; ready: boolean } {
  const [state, setState] = useState<{ courses: Course[]; ready: boolean }>({ courses: [], ready: false });
  useEffect(() => {
    const refresh = () => setState({ courses: readCourses(), ready: true });
    refresh();
    window.addEventListener(EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return state;
}
