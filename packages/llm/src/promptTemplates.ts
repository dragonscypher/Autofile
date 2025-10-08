export function makeQuestionPrompt(jd: string, skills: { required: string[]; bonus: string[] }, mix: { easy: number; medium: number; hard: number }, retrieved: string[] = []) {
    return `You are an expert interviewer. Create ${mix.easy + mix.medium + mix.hard} questions (grouped E/M/H) based on this JD and skills. JD: ${jd}\nRequired: ${skills.required.join(', ')}\nBonus: ${skills.bonus.join(', ')}\nContext: ${retrieved.join('\n')}`;
}

export function makeRubricPrompt(q: string) {
    return `Provide model answers (bullets) and keyword rubric for: ${q}`;
}
