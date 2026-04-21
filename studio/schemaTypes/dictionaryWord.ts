export default {
  name: 'dictionaryWord',
  title: 'Dictionary Word',
  type: 'document',
  fields: [
    {
      name: 'word',
      title: 'Vocabulary Word',
      type: 'string',
      validation: Rule => Rule.required().error('You need to enter a word.')
    },
    {
      name: 'pos',
      title: 'Part of Speech',
      type: 'string',
      options: {
        list: [
          { title: 'Noun', value: 'noun' },
          { title: 'Verb', value: 'verb' },
          { title: 'Adjective', value: 'adjective' },
          { title: 'Adverb', value: 'adverb' },
          { title: 'Preposition', value: 'preposition' },
          { title: 'Conjunction', value: 'conjunction' },
          { title: 'Pronoun', value: 'pronoun' }
        ],
        layout: 'dropdown'
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'definition',
      title: 'Definition',
      type: 'text',
      rows: 3,
      validation: Rule => Rule.required()
    },
    {
      name: 'example',
      title: 'Example Sentence (The Literature Anchor)',
      type: 'text',
      rows: 3,
      description: 'Optional: Enter a perfect, contextual example sentence from your curriculum. If left blank, the app will automatically AI-generate a B1/B2 level sentence for the student.'
    },
    {
      name: 'level',
      title: 'Proficiency Level',
      type: 'string',
      options: {
        list: [
          { title: 'A1 (Beginner)', value: 'A1' },
          { title: 'A2 (Elementary)', value: 'A2' },
          { title: 'B1 (Intermediate)', value: 'B1' },
          { title: 'B2 (Upper Intermediate)', value: 'B2' },
          { title: 'C1 (Advanced)', value: 'C1' },
          { title: 'C2 (Mastery)', value: 'C2' }
        ],
        layout: 'radio'
      }
    }
  ],
  preview: {
    select: {
      title: 'word',
      subtitle: 'pos'
    }
  }
}