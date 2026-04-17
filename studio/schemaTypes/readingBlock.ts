export default {
  name: 'readingBlock',
  title: 'Reading & Audio Block',
  type: 'object',
  fields: [
    {
      name: 'title',
      title: 'Block Title',
      type: 'string',
      initialValue: 'Read & Listen',
    },
    {
      name: 'instruction',
      title: 'Instructions',
      type: 'text',
      initialValue: 'Read the text below. You can also listen to the audio track while you read.',
    },
    // NEW AUDIO UPLOAD FEATURE
    {
      name: 'audioTrack',
      title: 'Audio Track (Upload MP3)',
      type: 'file',
      options: {
        accept: 'audio/*'
      },
      description: 'Upload your natural AI voice MP3 (from CapCut, Azure, or ElevenLabs) here.'
    },
    // THE READING PASSAGE
    {
      name: 'content',
      title: 'Reading Passage',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'Paste your full reading text here. You can use bold, italics, and bullet points.'
    }
  ]
};