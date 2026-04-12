import review from './review'
import resource from './resource'
import dictionaryWord from './dictionaryWord' // <-- 1. Make sure this line is here

export const schemaTypes = [
  review, 
  resource, 
  dictionaryWord // <-- 2. Make sure it is added inside these brackets!
]