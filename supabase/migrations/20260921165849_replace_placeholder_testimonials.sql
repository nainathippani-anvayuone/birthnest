-- The original seed testimonials (Ananya R., Priya K., Sneha M., Divya S.)
-- were placeholder copy invented for the initial build, not real reviews.
-- Replace them with more verbatim patient testimonials published on Dr.
-- Mythri Sharan's own clinic site (drmythrisharan.com), matching the two
-- added in the previous migration.
delete from public.testimonials
where patient_name in ('Ananya R.', 'Priya K.', 'Sneha M.', 'Divya S.');

insert into public.testimonials (patient_name, rating, message, is_published) values
  ('Aishwarya Sai', 5, 'We are so thankful to Dr. Mythri Sharan for being with us in our pregnancy journey. From the very beginning, she was very kind, calm, and clear in her explanations. We always felt comfortable and confident after speaking to her.', true),
  ('Gayathri Mantha', 5, 'I recently delivered my twins under the care of Dr. Mythri, and I can say with all my heart — she is truly the best. I cannot imagine walking this pregnancy journey without her. She wasn''t just my doctor — she became a friend, a guide, and a part of our family through it all.', true),
  ('Rizwana Angel', 5, 'I had the pleasure of having Dr. Mythri Ma''am as my gynecologist at Apollo Cradle Hospital in Hyderabad. From the moment I met her, she exuded confidence and warmth, which immediately put me at ease. I was naturally anxious about the delivery. However, Dr. Mythri Ma''am''s expertise and calm demeanor made all the difference.', true),
  ('Neelima Palavali', 5, 'I''m incredibly grateful to Dr. Mythri Sharan for her exceptional care during my twin pregnancy. Her personalized guidance, from diet planning to encouraging me to stay active, made a huge difference. Her compassion, expertise, and constant support provided so much comfort throughout the journey. Truly a blessing to our family!', true);
