import React from 'react';
import { CourseLab } from './CourseLab';

// The Writing Lab is now a thin wrapper around the generic CourseLab engine.
// All behavior lives in CourseLab.tsx; this file only supplies the writing
// course's configuration. The progress key is unchanged, so students keep
// every lesson they have already completed.
export const WritingLab = () => (
  <CourseLab
    config={{
      bankType: 'writingBank',
      moduleType: 'writingModule',
      progressKey: 'll_writingProgress',
      heroTitle: 'The Master Writing Course',
      heroSubtitle: 'From your first sentence to full academic essays — one lesson at a time.',
    }}
  />
);