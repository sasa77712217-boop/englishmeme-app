update public.learning_cards
set image_path = null
where image_path in (
  '/legacy-images/b00d58c2e39f93ed2ece83e2b88259c0.jpg',
  '/legacy-images/1747e771f6bf6dd0359dd04b1b973680.jpg'
);
