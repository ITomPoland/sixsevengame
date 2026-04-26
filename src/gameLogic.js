export const check67Gesture = (leftWrist, rightWrist) => {
  if (!leftWrist || !rightWrist) return 'neutral';
  
  // Zmniejszamy próg (threshold) do 0.05 (5% wysokości ekranu)
  // Dzięki temu zliczy nawet szybkie, małe ruchy w poziomie
  const threshold = 0.05; 
  
  const leftHigher = leftWrist.y < rightWrist.y - threshold;
  const rightHigher = rightWrist.y < leftWrist.y - threshold;
  
  if (leftHigher) return 'left_high';
  if (rightHigher) return 'right_high';
  
  return 'neutral';
};
