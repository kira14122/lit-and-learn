export default {
  name: 'dictionaryWord',
  title: 'Dictionary Word',
  type: 'document',
  fields: [
    {
      name: 'word',
      title: 'Vocabulary Word',
      type: 'string',
      validation: Rule => [
        Rule.required().error('You need to enter a word.'),
        Rule.custom(async (value, context) => {
          if (!value) return true; 
          
          const client = context.getClient({ apiVersion: '2023-05-03' });
          const id = context.document._id.replace(/^drafts\./, '');
          const searchTerm = value.toLowerCase().trim();
          
          // Check if the word matches the main 'word' OR exists inside the 'variations' array
          const query = `*[_type == "dictionaryWord" && (lower(word) == $word || count(variations[lower(@) == $word]) > 0) && !(_id in [$draft, $published])][0]`;
          
          const params = { 
            word: searchTerm, 
            draft: `drafts.${id}`, 
            published: id 
          };
          
          const existingWord = await client.fetch(query, params);
          
          if (existingWord) {
            // Check if it matched a variation instead of the root word
            const isVariation = existingWord.word?.toLowerCase() !== searchTerm;
            
            if (isVariation) {
              return `Oops! "${value}" is already saved as a variation under the root word "${existingWord.word}".`;
            }
            
            return `Oops! The word "${value}" is already in your dictionary.`;
          }
          
          return true;
        })
      ]
    },
    {
      name: 'variations',
      title: 'Word Variations & Conjugations',
      description: 'Add different tenses or forms (e.g., giving up, given up, gave up). Hit Enter after each one to add it to the list.',
      type: 'array',
      of: [{ type: 'string' }]
    },
    {
      name: 'pos',
      title: 'Part of Speech',
      type: 'string',
      options: {
        list: [
          // The Core Categories
          { title: 'Noun', value: 'noun' },
          { title: 'Verb', value: 'verb' },
          { title: 'Adjective', value: 'adjective' },
          { title: 'Adverb', value: 'adverb' },
          { title: 'Preposition', value: 'preposition' },
          { title: 'Conjunction', value: 'conjunction' },
          { title: 'Pronoun', value: 'pronoun' },
          { title: 'Interjection', value: 'interjection' },
          
          // The "Dual-Role" Chameleons
          { title: 'Noun / Verb', value: 'noun / verb' },
          { title: 'Adjective / Adverb', value: 'adjective / adverb' },
          { title: 'Adjective / Noun', value: 'adjective / noun' },
          
          // The ESL Advanced Essentials
          { title: 'Phrasal Verb', value: 'phrasal verb' },
          { title: 'Idiom / Expression', value: 'idiom / expression' },
          { title: 'Collocation', value: 'collocation' }
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