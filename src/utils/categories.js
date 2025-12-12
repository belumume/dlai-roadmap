/**
 * Single source of truth for category labels
 * Used by RoadmapView filters and Questionnaire options
 */
export const CATEGORY_LABELS = {
  agents: 'AI Agents & Automation',
  coding: 'AI-Assisted Coding',
  deployment: 'MLOps & Deployment',
  general: 'General AI/ML Topics',
  privacy: 'Privacy',
  prompting: 'Prompt Engineering',
  rag: 'RAG & Knowledge Systems',
  safety: 'AI Safety & Ethics',
  training: 'Fine-tuning & Training',
};

/**
 * Get display label for a category
 * Falls back to titleCase of raw category if not found
 */
export function getCategoryLabel(category) {
  return CATEGORY_LABELS[category] || category.charAt(0).toUpperCase() + category.slice(1);
}
