export const getChatResponse = (input: string): string => {
  const lowerInput = input.toLowerCase();

  const responses: Record<string, string[]> = {
    hello: [
    "Hello! I'm your LearnSphere AI tutor. How can I help you with your studies today?",
    'Hi there! Ready to learn? What topic would you like to explore?'],

    photosynthesis: [
    'Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to create oxygen and energy in the form of sugar. Think of it like a solar-powered factory inside the plant!',
    'In photosynthesis, plants convert light energy into chemical energy. The key ingredients are sunlight, CO2, and water, and the outputs are glucose (food for the plant) and oxygen.'],

    math: [
    'Math is all about patterns and logic! What specific area are you working on? Algebra, geometry, calculus?',
    "I can help with math! Could you provide a specific problem or concept you're stuck on?"],

    history: [
    'History helps us understand how the past shapes our present. Which era or event are you studying?',
    'I love history! Are we talking ancient civilizations, world wars, or something else?'],

    programming: [
    'Programming is like writing a recipe for a computer to follow. What language or concept are you learning?',
    'Coding is a great skill! Are you working on web development, data science, or maybe learning the basics like loops and variables?'],

    science: [
    'Science is the systematic study of the structure and behavior of the physical and natural world. Are you focusing on biology, chemistry, or physics?',
    'Science is fascinating! What specific scientific concept would you like to dive into?'],

    default: [
    "That's an interesting topic! Could you provide a bit more detail so I can give you the best explanation?",
    "I'm not entirely sure I understand. Could you rephrase your question or specify the subject area?",
    "Let's explore that! To give you a precise answer, could you tell me what specific part of that topic you're struggling with?"]

  };

  if (
  lowerInput.includes('hello') ||
  lowerInput.includes('hi') ||
  lowerInput.includes('hey'))
  {
    return responses.hello[Math.floor(Math.random() * responses.hello.length)];
  }
  if (lowerInput.includes('photosynthesis')) {
    return responses.photosynthesis[
    Math.floor(Math.random() * responses.photosynthesis.length)];

  }
  if (
  lowerInput.includes('math') ||
  lowerInput.includes('algebra') ||
  lowerInput.includes('calculus'))
  {
    return responses.math[Math.floor(Math.random() * responses.math.length)];
  }
  if (
  lowerInput.includes('history') ||
  lowerInput.includes('war') ||
  lowerInput.includes('century'))
  {
    return responses.history[
    Math.floor(Math.random() * responses.history.length)];

  }
  if (
  lowerInput.includes('programming') ||
  lowerInput.includes('code') ||
  lowerInput.includes('javascript'))
  {
    return responses.programming[
    Math.floor(Math.random() * responses.programming.length)];

  }
  if (
  lowerInput.includes('science') ||
  lowerInput.includes('biology') ||
  lowerInput.includes('physics'))
  {
    return responses.science[
    Math.floor(Math.random() * responses.science.length)];

  }

  return responses.default[Math.floor(Math.random() * responses.default.length)];
};