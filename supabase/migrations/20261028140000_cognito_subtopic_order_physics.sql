-- Reorganise Physics flashcards into numbered subtopics following the order of the Cognito AQA GCSE course
-- (Topic N -> lessons N.1, N.2, ...). Questions keep their IDs and student progress; only the subtopic they sit in
-- changes. Lessons with no questions yet are absent, so numbers can have gaps. Safe to run more than once.
begin;

-- PHYS-T01
insert into public.subtopics (topic_id, name, sort_order) values
  ('PHYS-T01', '1.1 Energy Stores & Systems', 1),
  ('PHYS-T01', '1.2 Energy Transfer Examples', 2),
  ('PHYS-T01', '1.3 Kinetic Energy', 3),
  ('PHYS-T01', '1.4 Gravitational Potential Energy', 4),
  ('PHYS-T01', '1.5 Transfer Between KE & GPE', 5),
  ('PHYS-T01', '1.6 Elastic Potential Energy', 6),
  ('PHYS-T01', '1.7 Specific Heat Capacity', 7),
  ('PHYS-T01', '1.8 Conservation of Energy', 8),
  ('PHYS-T01', '1.9 Power', 9),
  ('PHYS-T01', '1.10 Conduction, Convection & Radiation', 10),
  ('PHYS-T01', '1.11 Reducing Unwanted Energy Transfers', 11),
  ('PHYS-T01', '1.12 Efficiency', 12),
  ('PHYS-T01', '1.13 Energy Resources Introduction', 13)
on conflict (topic_id, name) do update set sort_order = excluded.sort_order;

update public.question_catalog qc set subtopic_id = st.id
from (values
  ('PHYS-T01-Q001', '1.1 Energy Stores & Systems'),
  ('PHYS-T01-Q002', '1.2 Energy Transfer Examples'),
  ('PHYS-T01-Q004', '1.2 Energy Transfer Examples'),
  ('PHYS-T01-Q014', '1.3 Kinetic Energy'),
  ('PHYS-T01-Q021', '1.3 Kinetic Energy'),
  ('PHYS-T01-Q015', '1.4 Gravitational Potential Energy'),
  ('PHYS-T01-Q003', '1.5 Transfer Between KE & GPE'),
  ('PHYS-T01-Q016', '1.6 Elastic Potential Energy'),
  ('PHYS-T01-Q019', '1.7 Specific Heat Capacity'),
  ('PHYS-T01-Q005', '1.8 Conservation of Energy'),
  ('PHYS-T01-Q006', '1.8 Conservation of Energy'),
  ('PHYS-T01-Q009', '1.9 Power'),
  ('PHYS-T01-Q017', '1.9 Power'),
  ('PHYS-T01-Q022', '1.9 Power'),
  ('PHYS-T01-Q008', '1.10 Conduction, Convection & Radiation'),
  ('PHYS-T01-Q007', '1.11 Reducing Unwanted Energy Transfers'),
  ('PHYS-T01-Q020', '1.11 Reducing Unwanted Energy Transfers'),
  ('PHYS-T01-Q010', '1.12 Efficiency'),
  ('PHYS-T01-Q018', '1.12 Efficiency'),
  ('PHYS-T01-Q011', '1.13 Energy Resources Introduction'),
  ('PHYS-T01-Q012', '1.13 Energy Resources Introduction'),
  ('PHYS-T01-Q013', '1.13 Energy Resources Introduction')
) as m(question_id, subtopic_name)
join public.subtopics st on st.topic_id = 'PHYS-T01' and st.name = m.subtopic_name
where qc.id = m.question_id;

-- Remove the previous groupings once they are empty.
delete from public.subtopics st where st.topic_id = 'PHYS-T01'
  and not exists (select 1 from public.question_catalog qc where qc.subtopic_id = st.id);

-- PHYS-T02
insert into public.subtopics (topic_id, name, sort_order) values
  ('PHYS-T02', '2.1 Circuits Introduction', 1),
  ('PHYS-T02', '2.2 Charge, Current & Time', 2),
  ('PHYS-T02', '2.3 V = IR Equation & I–V Graphs', 3),
  ('PHYS-T02', '2.4 Components', 4),
  ('PHYS-T02', '2.5 Series Circuits', 5),
  ('PHYS-T02', '2.6 Parallel Circuits', 6),
  ('PHYS-T02', '2.7 AC & DC Current', 7),
  ('PHYS-T02', '2.8 Mains Wiring & Safety', 8),
  ('PHYS-T02', '2.9 Energy & Power Formulas', 9),
  ('PHYS-T02', '2.11 National Grid', 11),
  ('PHYS-T02', '2.12 Static Electricity – Charging', 12),
  ('PHYS-T02', '2.13 Electric Fields', 13)
on conflict (topic_id, name) do update set sort_order = excluded.sort_order;

update public.question_catalog qc set subtopic_id = st.id
from (values
  ('PHYS-T02-Q002', '2.1 Circuits Introduction'),
  ('PHYS-T02-Q001', '2.2 Charge, Current & Time'),
  ('PHYS-T02-Q019', '2.2 Charge, Current & Time'),
  ('PHYS-T02-Q003', '2.3 V = IR Equation & I–V Graphs'),
  ('PHYS-T02-Q004', '2.3 V = IR Equation & I–V Graphs'),
  ('PHYS-T02-Q020', '2.3 V = IR Equation & I–V Graphs'),
  ('PHYS-T02-Q024', '2.3 V = IR Equation & I–V Graphs'),
  ('PHYS-T02-Q025', '2.3 V = IR Equation & I–V Graphs'),
  ('PHYS-T02-Q005', '2.4 Components'),
  ('PHYS-T02-Q006', '2.4 Components'),
  ('PHYS-T02-Q007', '2.4 Components'),
  ('PHYS-T02-Q008', '2.4 Components'),
  ('PHYS-T02-Q009', '2.5 Series Circuits'),
  ('PHYS-T02-Q026', '2.5 Series Circuits'),
  ('PHYS-T02-Q010', '2.6 Parallel Circuits'),
  ('PHYS-T02-Q011', '2.6 Parallel Circuits'),
  ('PHYS-T02-Q012', '2.7 AC & DC Current'),
  ('PHYS-T02-Q013', '2.8 Mains Wiring & Safety'),
  ('PHYS-T02-Q014', '2.8 Mains Wiring & Safety'),
  ('PHYS-T02-Q015', '2.8 Mains Wiring & Safety'),
  ('PHYS-T02-Q021', '2.9 Energy & Power Formulas'),
  ('PHYS-T02-Q022', '2.9 Energy & Power Formulas'),
  ('PHYS-T02-Q023', '2.9 Energy & Power Formulas'),
  ('PHYS-T02-Q027', '2.9 Energy & Power Formulas'),
  ('PHYS-T02-Q016', '2.11 National Grid'),
  ('PHYS-T02-Q017', '2.12 Static Electricity – Charging'),
  ('PHYS-T02-Q018', '2.13 Electric Fields')
) as m(question_id, subtopic_name)
join public.subtopics st on st.topic_id = 'PHYS-T02' and st.name = m.subtopic_name
where qc.id = m.question_id;

-- Remove the previous groupings once they are empty.
delete from public.subtopics st where st.topic_id = 'PHYS-T02'
  and not exists (select 1 from public.question_catalog qc where qc.subtopic_id = st.id);

-- PHYS-T03
insert into public.subtopics (topic_id, name, sort_order) values
  ('PHYS-T03', '3.1 Density', 1),
  ('PHYS-T03', '3.2 The Particle Model', 2),
  ('PHYS-T03', '3.3 Internal Energy & Changes of State', 3),
  ('PHYS-T03', '3.4 Specific Latent Heat', 4),
  ('PHYS-T03', '3.5 Factors Affecting Gas Pressure', 5),
  ('PHYS-T03', '3.6 Pressure & Volume', 6)
on conflict (topic_id, name) do update set sort_order = excluded.sort_order;

update public.question_catalog qc set subtopic_id = st.id
from (values
  ('PHYS-T03-Q001', '3.1 Density'),
  ('PHYS-T03-Q012', '3.1 Density'),
  ('PHYS-T03-Q013', '3.1 Density'),
  ('PHYS-T03-Q017', '3.1 Density'),
  ('PHYS-T03-Q018', '3.1 Density'),
  ('PHYS-T03-Q002', '3.2 The Particle Model'),
  ('PHYS-T03-Q003', '3.3 Internal Energy & Changes of State'),
  ('PHYS-T03-Q004', '3.3 Internal Energy & Changes of State'),
  ('PHYS-T03-Q005', '3.3 Internal Energy & Changes of State'),
  ('PHYS-T03-Q006', '3.3 Internal Energy & Changes of State'),
  ('PHYS-T03-Q007', '3.3 Internal Energy & Changes of State'),
  ('PHYS-T03-Q014', '3.3 Internal Energy & Changes of State'),
  ('PHYS-T03-Q019', '3.3 Internal Energy & Changes of State'),
  ('PHYS-T03-Q020', '3.3 Internal Energy & Changes of State'),
  ('PHYS-T03-Q021', '3.3 Internal Energy & Changes of State'),
  ('PHYS-T03-Q022', '3.3 Internal Energy & Changes of State'),
  ('PHYS-T03-Q023', '3.3 Internal Energy & Changes of State'),
  ('PHYS-T03-Q008', '3.4 Specific Latent Heat'),
  ('PHYS-T03-Q015', '3.4 Specific Latent Heat'),
  ('PHYS-T03-Q009', '3.5 Factors Affecting Gas Pressure'),
  ('PHYS-T03-Q010', '3.5 Factors Affecting Gas Pressure'),
  ('PHYS-T03-Q011', '3.6 Pressure & Volume'),
  ('PHYS-T03-Q016', '3.6 Pressure & Volume')
) as m(question_id, subtopic_name)
join public.subtopics st on st.topic_id = 'PHYS-T03' and st.name = m.subtopic_name
where qc.id = m.question_id;

-- Remove the previous groupings once they are empty.
delete from public.subtopics st where st.topic_id = 'PHYS-T03'
  and not exists (select 1 from public.question_catalog qc where qc.subtopic_id = st.id);

-- PHYS-T04
insert into public.subtopics (topic_id, name, sort_order) values
  ('PHYS-T04', '4.1 Atomic Structure & Isotopes', 1),
  ('PHYS-T04', '4.2 Developing the Model of the Atom', 2),
  ('PHYS-T04', '4.3 Alpha, Beta & Gamma Radiation', 3),
  ('PHYS-T04', '4.4 Nuclear Decay Equations', 4),
  ('PHYS-T04', '4.5 Radioactive Decay & Half-Life', 5),
  ('PHYS-T04', '4.6 Why Radiation Is Harmful', 6),
  ('PHYS-T04', '4.7 Using Radiation in Medicine', 7),
  ('PHYS-T04', '4.8 Nuclear Fission', 8),
  ('PHYS-T04', '4.9 Nuclear Fusion', 9)
on conflict (topic_id, name) do update set sort_order = excluded.sort_order;

update public.question_catalog qc set subtopic_id = st.id
from (values
  ('PHYS-T04-Q001', '4.1 Atomic Structure & Isotopes'),
  ('PHYS-T04-Q002', '4.1 Atomic Structure & Isotopes'),
  ('PHYS-T04-Q003', '4.1 Atomic Structure & Isotopes'),
  ('PHYS-T04-Q004', '4.2 Developing the Model of the Atom'),
  ('PHYS-T04-Q007', '4.3 Alpha, Beta & Gamma Radiation'),
  ('PHYS-T04-Q019', '4.4 Nuclear Decay Equations'),
  ('PHYS-T04-Q020', '4.4 Nuclear Decay Equations'),
  ('PHYS-T04-Q005', '4.5 Radioactive Decay & Half-Life'),
  ('PHYS-T04-Q006', '4.5 Radioactive Decay & Half-Life'),
  ('PHYS-T04-Q008', '4.5 Radioactive Decay & Half-Life'),
  ('PHYS-T04-Q015', '4.5 Radioactive Decay & Half-Life'),
  ('PHYS-T04-Q018', '4.5 Radioactive Decay & Half-Life'),
  ('PHYS-T04-Q009', '4.6 Why Radiation Is Harmful'),
  ('PHYS-T04-Q010', '4.6 Why Radiation Is Harmful'),
  ('PHYS-T04-Q011', '4.6 Why Radiation Is Harmful'),
  ('PHYS-T04-Q016', '4.6 Why Radiation Is Harmful'),
  ('PHYS-T04-Q017', '4.6 Why Radiation Is Harmful'),
  ('PHYS-T04-Q012', '4.7 Using Radiation in Medicine'),
  ('PHYS-T04-Q013', '4.8 Nuclear Fission'),
  ('PHYS-T04-Q014', '4.9 Nuclear Fusion')
) as m(question_id, subtopic_name)
join public.subtopics st on st.topic_id = 'PHYS-T04' and st.name = m.subtopic_name
where qc.id = m.question_id;

-- Remove the previous groupings once they are empty.
delete from public.subtopics st where st.topic_id = 'PHYS-T04'
  and not exists (select 1 from public.question_catalog qc where qc.subtopic_id = st.id);

-- PHYS-T05
insert into public.subtopics (topic_id, name, sort_order) values
  ('PHYS-T05', '5.1 Scalar & Vector Quantities', 1),
  ('PHYS-T05', '5.2 Contact & Non-Contact Forces', 2),
  ('PHYS-T05', '5.4 Mass, Weight & Gravity', 4),
  ('PHYS-T05', '5.5 Resultant Forces', 5),
  ('PHYS-T05', '5.7 Work Done', 7),
  ('PHYS-T05', '5.8 Hooke''s Law & Spring Constant', 8),
  ('PHYS-T05', '5.9 Moments – The Turning Effect', 9),
  ('PHYS-T05', '5.10 Moments – Seesaws & Gears', 10),
  ('PHYS-T05', '5.11 Pressure Equation & How It Works', 11),
  ('PHYS-T05', '5.12 Liquid Pressure & Upthrust', 12),
  ('PHYS-T05', '5.13 Atmospheric Pressure', 13),
  ('PHYS-T05', '5.14 Speed, Velocity & Displacement', 14),
  ('PHYS-T05', '5.16 Acceleration', 16),
  ('PHYS-T05', '5.18 Terminal Velocity', 18),
  ('PHYS-T05', '5.19 Newton''s 1st & 2nd Laws', 19),
  ('PHYS-T05', '5.20 Newton''s 3rd Law', 20),
  ('PHYS-T05', '5.21 Stopping Distances', 21),
  ('PHYS-T05', '5.23 Momentum – Conservation', 23),
  ('PHYS-T05', '5.24 Momentum & Force', 24)
on conflict (topic_id, name) do update set sort_order = excluded.sort_order;

update public.question_catalog qc set subtopic_id = st.id
from (values
  ('PHYS-T05-Q035', '5.1 Scalar & Vector Quantities'),
  ('PHYS-T05-Q036', '5.1 Scalar & Vector Quantities'),
  ('PHYS-T05-Q001', '5.2 Contact & Non-Contact Forces'),
  ('PHYS-T05-Q034', '5.2 Contact & Non-Contact Forces'),
  ('PHYS-T05-Q003', '5.4 Mass, Weight & Gravity'),
  ('PHYS-T05-Q020', '5.4 Mass, Weight & Gravity'),
  ('PHYS-T05-Q002', '5.5 Resultant Forces'),
  ('PHYS-T05-Q004', '5.7 Work Done'),
  ('PHYS-T05-Q021', '5.7 Work Done'),
  ('PHYS-T05-Q005', '5.8 Hooke''s Law & Spring Constant'),
  ('PHYS-T05-Q006', '5.8 Hooke''s Law & Spring Constant'),
  ('PHYS-T05-Q022', '5.8 Hooke''s Law & Spring Constant'),
  ('PHYS-T05-Q030', '5.8 Hooke''s Law & Spring Constant'),
  ('PHYS-T05-Q007', '5.9 Moments – The Turning Effect'),
  ('PHYS-T05-Q023', '5.9 Moments – The Turning Effect'),
  ('PHYS-T05-Q008', '5.10 Moments – Seesaws & Gears'),
  ('PHYS-T05-Q024', '5.11 Pressure Equation & How It Works'),
  ('PHYS-T05-Q009', '5.12 Liquid Pressure & Upthrust'),
  ('PHYS-T05-Q025', '5.12 Liquid Pressure & Upthrust'),
  ('PHYS-T05-Q010', '5.13 Atmospheric Pressure'),
  ('PHYS-T05-Q032', '5.14 Speed, Velocity & Displacement'),
  ('PHYS-T05-Q026', '5.16 Acceleration'),
  ('PHYS-T05-Q016', '5.18 Terminal Velocity'),
  ('PHYS-T05-Q011', '5.19 Newton''s 1st & 2nd Laws'),
  ('PHYS-T05-Q012', '5.19 Newton''s 1st & 2nd Laws'),
  ('PHYS-T05-Q027', '5.19 Newton''s 1st & 2nd Laws'),
  ('PHYS-T05-Q031', '5.19 Newton''s 1st & 2nd Laws'),
  ('PHYS-T05-Q013', '5.20 Newton''s 3rd Law'),
  ('PHYS-T05-Q014', '5.21 Stopping Distances'),
  ('PHYS-T05-Q015', '5.21 Stopping Distances'),
  ('PHYS-T05-Q017', '5.23 Momentum – Conservation'),
  ('PHYS-T05-Q018', '5.23 Momentum – Conservation'),
  ('PHYS-T05-Q028', '5.23 Momentum – Conservation'),
  ('PHYS-T05-Q029', '5.23 Momentum – Conservation'),
  ('PHYS-T05-Q019', '5.24 Momentum & Force'),
  ('PHYS-T05-Q033', '5.24 Momentum & Force')
) as m(question_id, subtopic_name)
join public.subtopics st on st.topic_id = 'PHYS-T05' and st.name = m.subtopic_name
where qc.id = m.question_id;

-- Remove the previous groupings once they are empty.
delete from public.subtopics st where st.topic_id = 'PHYS-T05'
  and not exists (select 1 from public.question_catalog qc where qc.subtopic_id = st.id);

-- PHYS-T06
insert into public.subtopics (topic_id, name, sort_order) values
  ('PHYS-T06', '6.1 Longitudinal & Transverse Waves', 1),
  ('PHYS-T06', '6.3 Reflection', 3),
  ('PHYS-T06', '6.4 Refraction', 4),
  ('PHYS-T06', '6.5 Sound Waves & Hearing', 5),
  ('PHYS-T06', '6.6 Ultrasound', 6),
  ('PHYS-T06', '6.8 Electromagnetic Waves', 8),
  ('PHYS-T06', '6.9 Radio Waves', 9),
  ('PHYS-T06', '6.10 Microwaves & Infrared', 10),
  ('PHYS-T06', '6.11 UV Light', 11),
  ('PHYS-T06', '6.12 X-Rays & Gamma Rays', 12),
  ('PHYS-T06', '6.13 Dangers of Electromagnetic Radiation', 13),
  ('PHYS-T06', '6.17 Absorbing & Emitting Radiation', 17)
on conflict (topic_id, name) do update set sort_order = excluded.sort_order;

update public.question_catalog qc set subtopic_id = st.id
from (values
  ('PHYS-T06-Q001', '6.1 Longitudinal & Transverse Waves'),
  ('PHYS-T06-Q002', '6.1 Longitudinal & Transverse Waves'),
  ('PHYS-T06-Q003', '6.1 Longitudinal & Transverse Waves'),
  ('PHYS-T06-Q014', '6.1 Longitudinal & Transverse Waves'),
  ('PHYS-T06-Q015', '6.1 Longitudinal & Transverse Waves'),
  ('PHYS-T06-Q017', '6.1 Longitudinal & Transverse Waves'),
  ('PHYS-T06-Q019', '6.1 Longitudinal & Transverse Waves'),
  ('PHYS-T06-Q004', '6.3 Reflection'),
  ('PHYS-T06-Q005', '6.4 Refraction'),
  ('PHYS-T06-Q018', '6.4 Refraction'),
  ('PHYS-T06-Q006', '6.5 Sound Waves & Hearing'),
  ('PHYS-T06-Q007', '6.6 Ultrasound'),
  ('PHYS-T06-Q016', '6.6 Ultrasound'),
  ('PHYS-T06-Q008', '6.8 Electromagnetic Waves'),
  ('PHYS-T06-Q009', '6.8 Electromagnetic Waves'),
  ('PHYS-T06-Q010', '6.9 Radio Waves'),
  ('PHYS-T06-Q020', '6.9 Radio Waves'),
  ('PHYS-T06-Q021', '6.10 Microwaves & Infrared'),
  ('PHYS-T06-Q022', '6.11 UV Light'),
  ('PHYS-T06-Q023', '6.12 X-Rays & Gamma Rays'),
  ('PHYS-T06-Q024', '6.12 X-Rays & Gamma Rays'),
  ('PHYS-T06-Q025', '6.13 Dangers of Electromagnetic Radiation'),
  ('PHYS-T06-Q026', '6.13 Dangers of Electromagnetic Radiation'),
  ('PHYS-T06-Q027', '6.13 Dangers of Electromagnetic Radiation'),
  ('PHYS-T06-Q011', '6.17 Absorbing & Emitting Radiation'),
  ('PHYS-T06-Q012', '6.17 Absorbing & Emitting Radiation'),
  ('PHYS-T06-Q013', '6.17 Absorbing & Emitting Radiation')
) as m(question_id, subtopic_name)
join public.subtopics st on st.topic_id = 'PHYS-T06' and st.name = m.subtopic_name
where qc.id = m.question_id;

-- Remove the previous groupings once they are empty.
delete from public.subtopics st where st.topic_id = 'PHYS-T06'
  and not exists (select 1 from public.question_catalog qc where qc.subtopic_id = st.id);

-- PHYS-T07
insert into public.subtopics (topic_id, name, sort_order) values
  ('PHYS-T07', '7.1 Magnets & Magnetic Fields', 1),
  ('PHYS-T07', '7.2 Permanent & Induced Magnets', 2),
  ('PHYS-T07', '7.3 Electromagnetism', 3),
  ('PHYS-T07', '7.4 Motor Effect', 4),
  ('PHYS-T07', '7.5 How the Electric Motor Works', 5),
  ('PHYS-T07', '7.6 The Generator Effect', 6),
  ('PHYS-T07', '7.8 Loudspeakers & Microphones', 8),
  ('PHYS-T07', '7.9 How Transformers Work', 9),
  ('PHYS-T07', '7.10 Transformer Calculation', 10)
on conflict (topic_id, name) do update set sort_order = excluded.sort_order;

update public.question_catalog qc set subtopic_id = st.id
from (values
  ('PHYS-T07-Q001', '7.1 Magnets & Magnetic Fields'),
  ('PHYS-T07-Q002', '7.1 Magnets & Magnetic Fields'),
  ('PHYS-T07-Q003', '7.1 Magnets & Magnetic Fields'),
  ('PHYS-T07-Q017', '7.1 Magnets & Magnetic Fields'),
  ('PHYS-T07-Q019', '7.2 Permanent & Induced Magnets'),
  ('PHYS-T07-Q020', '7.2 Permanent & Induced Magnets'),
  ('PHYS-T07-Q004', '7.3 Electromagnetism'),
  ('PHYS-T07-Q005', '7.3 Electromagnetism'),
  ('PHYS-T07-Q006', '7.4 Motor Effect'),
  ('PHYS-T07-Q014', '7.4 Motor Effect'),
  ('PHYS-T07-Q007', '7.5 How the Electric Motor Works'),
  ('PHYS-T07-Q008', '7.6 The Generator Effect'),
  ('PHYS-T07-Q009', '7.6 The Generator Effect'),
  ('PHYS-T07-Q010', '7.8 Loudspeakers & Microphones'),
  ('PHYS-T07-Q011', '7.8 Loudspeakers & Microphones'),
  ('PHYS-T07-Q012', '7.9 How Transformers Work'),
  ('PHYS-T07-Q013', '7.9 How Transformers Work'),
  ('PHYS-T07-Q015', '7.10 Transformer Calculation'),
  ('PHYS-T07-Q016', '7.10 Transformer Calculation'),
  ('PHYS-T07-Q018', '7.10 Transformer Calculation')
) as m(question_id, subtopic_name)
join public.subtopics st on st.topic_id = 'PHYS-T07' and st.name = m.subtopic_name
where qc.id = m.question_id;

-- Remove the previous groupings once they are empty.
delete from public.subtopics st where st.topic_id = 'PHYS-T07'
  and not exists (select 1 from public.question_catalog qc where qc.subtopic_id = st.id);

-- PHYS-T08
insert into public.subtopics (topic_id, name, sort_order) values
  ('PHYS-T08', '8.1 The Solar System & the Universe', 1),
  ('PHYS-T08', '8.2 Life Cycle of Stars', 2),
  ('PHYS-T08', '8.3 Orbits', 3),
  ('PHYS-T08', '8.4 Red Shift', 4),
  ('PHYS-T08', '8.5 The Origin of the Universe', 5)
on conflict (topic_id, name) do update set sort_order = excluded.sort_order;

update public.question_catalog qc set subtopic_id = st.id
from (values
  ('PHYS-T08-Q001', '8.1 The Solar System & the Universe'),
  ('PHYS-T08-Q015', '8.1 The Solar System & the Universe'),
  ('PHYS-T08-Q002', '8.2 Life Cycle of Stars'),
  ('PHYS-T08-Q003', '8.2 Life Cycle of Stars'),
  ('PHYS-T08-Q004', '8.2 Life Cycle of Stars'),
  ('PHYS-T08-Q005', '8.2 Life Cycle of Stars'),
  ('PHYS-T08-Q006', '8.2 Life Cycle of Stars'),
  ('PHYS-T08-Q007', '8.3 Orbits'),
  ('PHYS-T08-Q008', '8.3 Orbits'),
  ('PHYS-T08-Q014', '8.3 Orbits'),
  ('PHYS-T08-Q016', '8.3 Orbits'),
  ('PHYS-T08-Q017', '8.3 Orbits'),
  ('PHYS-T08-Q009', '8.4 Red Shift'),
  ('PHYS-T08-Q010', '8.4 Red Shift'),
  ('PHYS-T08-Q011', '8.5 The Origin of the Universe'),
  ('PHYS-T08-Q012', '8.5 The Origin of the Universe'),
  ('PHYS-T08-Q013', '8.5 The Origin of the Universe')
) as m(question_id, subtopic_name)
join public.subtopics st on st.topic_id = 'PHYS-T08' and st.name = m.subtopic_name
where qc.id = m.question_id;

-- Remove the previous groupings once they are empty.
delete from public.subtopics st where st.topic_id = 'PHYS-T08'
  and not exists (select 1 from public.question_catalog qc where qc.subtopic_id = st.id);

commit;
