-- "Foundation only" is no longer a valid tier tag: Foundation content stays available to Higher students.
-- Retag those questions as available to both tiers; Higher-only stays the only way to hide a question from Foundation.
update public.question_catalog set tier = 'Foundation and Higher' where tier = 'Foundation only';
