import React, { useState, useEffect } from 'react';
import { PortableText } from '@portabletext/react';
import { client } from '../sanityClient'; // <--- The Engine now fetches its own fuel!

// --- 1. THE AUTONOMOUS HIGHLIGHTER ---
const HighlightString = (text: string, dictionary: any[]) => {
  if (!text || typeof text !== 'string') return <>{text}</>;
  if (!dictionary || dictionary.length === 0) return <>{text}</>;

  // Check for the word under any name your Sanity schema might use
  const dictWords = dictionary.map(item => ({
    ...item,
    lookupWord: (item.word || item.title || item.term || item.name || '').trim()
  })).filter(item => item.lookupWord);

  if (dictWords.length === 0) return <>{text}</>;

  const wordsToFind = dictWords.map(w => w.lookupWord.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|');
  const regex = new RegExp(`\\b(${wordsToFind})\\b`, 'gi');

  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) => {
        const match = dictWords.find((item: any) => item.lookupWord.toLowerCase() === part.toLowerCase());
        if (match) {
          return (
            <span 
              key={i} 
              className="text-purple-600 font-bold border-b-2 border-purple-200 cursor-pointer hover:bg-purple-100 transition-colors px-1 rounded"
              title={match.definition || 'Click to save to Vault!'}
              onClick={() => alert(`⭐ Saved '${match.lookupWord}' to your Personal Vault!`)}
            >
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
};

// Generates the rules to highlight words even if they are inside complex Sanity Arrays
const getCustomComponents = (dictionary: any[]) => ({
  block: {
    normal: ({children}: any) => {
      const processed = React.Children.map(children, child => {
        if (typeof child === 'string') return HighlightString(child, dictionary);
        return child;
      });
      return <p className="mb-4 leading-relaxed">{processed}</p>;
    }
  }
});


// --- 2. MAIN LESSON COMPONENT ---
export default function SmartReader(props: any) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [dictionary, setDictionary] = useState<any[]>(props.dictionary || []);

  // Fetch dictionary automatically if the parent page forgot to send it!
  useEffect(() => {
    if (!props.dictionary || props.dictionary.length === 0) {
      client.fetch(`*[_type == "dictionaryWord"]`).then(setDictionary).catch(console.error);
    }
  }, [props.dictionary]);

  const title = props.readingTitle || props.title || "Untitled Lesson";
  const content = props.readingContent || props.content || props.body || props.text;
  const audio = props.audioUrl || props.audio;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-white text-slate-900">
      <div className="w-full md:w-1/2 p-8 md:p-12 border-r border-slate-200 overflow-y-auto">
        <h1 className="text-4xl font-bold mb-6 text-slate-800 tracking-tight">{title}</h1>
        
        {audio && (
          <div className="mb-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <audio controls className="w-full h-10" src={audio} />
          </div>
        )}

        <div className="prose prose-lg prose-slate max-w-none mb-12">
          {content ? (
            Array.isArray(content) ? (
              <PortableText value={content} components={getCustomComponents(dictionary)} />
            ) : (
              <p>{HighlightString(content, dictionary)}</p>
            )
          ) : (
            <p className="text-slate-400 italic">Reading content area.</p>
          )}
        </div>

        {!isUnlocked && (
          <div className="mt-10 pt-10 border-t border-slate-100 text-center">
            <button 
              onClick={() => setIsUnlocked(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-10 rounded-2xl shadow-lg transition-all"
            >
              I'm Ready for the Questions
            </button>
          </div>
        )}
      </div>

      <div className="w-full md:w-1/2 p-8 md:p-12 bg-slate-50 overflow-y-auto">
        {isUnlocked ? (
          <div className="space-y-8 animate-in fade-in duration-500">
             {props.children}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
            <span className="text-7xl mb-6 text-indigo-200">📖</span>
            <p className="text-center max-w-xs">Read the text on the left to unlock exercises.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- 3. EXPORTS FOR OTHER FILES ---

export const IconStar = ({ className = "w-6 h-6 text-yellow-500" }: any) => (
  <svg fill="currentColor" viewBox="0 0 24 24" className={className} style={{display: 'inline-block'}}><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
);

// THE GATSBY REVIEW COMPONENT
export const SmartText = (props: any) => {
  const [dictionary, setDictionary] = useState<any[]>([]);

  // Automatically fetch the dictionary for Gatsby Reviews!
  useEffect(() => {
    client.fetch(`*[_type == "dictionaryWord"]`).then(setDictionary).catch(console.error);
  }, []);

  let data = props.value || props.review || props.content || props.description || props.children || props.word || props.text;
  
  if (!data) {
    for (const key in props) {
      if (key === 'className') continue;
      if ((Array.isArray(props[key]) && props[key].length > 0) || (typeof props[key] === 'string' && props[key].trim().length > 0)) {
        data = props[key]; break;
      }
    }
  }

  if (!data) return null;

  if (props.className && props.className.includes('purple')) {
    return <span className={props.className}>{data}</span>;
  }

  return (
    <div className={`prose prose-slate max-w-none ${props.className || ''}`}>
      {Array.isArray(data) ? (
        <PortableText value={data} components={getCustomComponents(dictionary)} />
      ) : (
        <p>{HighlightString(data, dictionary)}</p>
      )}
    </div>
  );
};