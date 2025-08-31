#!/usr/bin/env node

/**
 * Test script to verify LLM routing based on model names
 */

const models = [
  // DeepSeek models
  'deepseek-chat',
  'deepseek-coder',
  'deepseek-v2',
  
  // GPT-4 models (support json_schema)
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4o-2024-08-06',
  'gpt-4-turbo',
  'gpt-4',
  'gpt-3.5-turbo',
  
  // O1 models (limited params, json_object only)
  'o1-preview',
  'o1-mini',
  'o1',
  
  // Future models
  'gpt-5',
  'gpt-5-turbo',
];

function getServiceForModel(modelName) {
  const model = modelName.toLowerCase();
  
  // DeepSeek models
  if (model.includes('deepseek')) {
    return 'deepseek';
  }
  
  // O1 and newer models (GPT-5 category)
  if (model.includes('o1-') || model.includes('gpt-5')) {
    return 'gpt5';
  }
  
  // GPT-4 and GPT-4o models (supports json_schema)
  // This includes: gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo
  return 'gpt4';
}

console.log('LLM Model Routing Test');
console.log('======================\n');

console.log('Model Name                  -> Service    | Features');
console.log('--------------------------------------------------------');

models.forEach(model => {
  const service = getServiceForModel(model);
  let features = '';
  
  switch(service) {
    case 'deepseek':
      features = 'json_object, cost-effective';
      break;
    case 'gpt5':
      features = 'json_object, no temp/top_p, max_completion_tokens';
      break;
    case 'gpt4':
      features = 'json_schema, full params, structured output';
      break;
  }
  
  console.log(`${model.padEnd(27)} -> ${service.padEnd(10)} | ${features}`);
});

console.log('\nCurrent configuration (from .envrc.override):');
console.log('----------------------------------------------');
console.log('LLM_MODEL_QUIZ_PARSER="deepseek-chat" -> Service: deepseek');
console.log('\nThis will use DeepSeekService with json_object response format.');