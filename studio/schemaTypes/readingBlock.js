export default {
  name: 'readingBlock',
  title: 'Reading & Audio Block',
  type: 'object',
  fields: [
    {
      name: 'instruction',
      title: 'Instructions',
      type: 'string',
      initialValue: 'Read the passage and listen to the audio.',
    },
    {
      name: 'text',
      title: 'Reading Text',
      type: 'text',
      rows: 10,
      description: 'Paste the story or article here.',
    },
    {
      name: 'audio',
      title: 'Audio File',
      type: 'file',
      options: { accept: 'audio/*' },
      description: 'Upload the MP3 of the human reading the text.',
    }
  ],
  preview: {
    select: { title: 'instruction' },
    prepare() { return { title: '📖 Reading Passage' } }
  }
};