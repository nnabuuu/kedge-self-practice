const { Client } = require('pg');

// Database connection
const client = new Client({
  connectionString: 'postgres://arthur:arthur@34.84.100.187:5432/arthur-test'
});

async function associateQuizzes() {
  try {
    await client.connect();
    console.log('Connected to database');

    // First, let's see what quizzes we have
    const quizzesResult = await client.query(`
      SELECT id, question, knowledge_point_id 
      FROM kedge_practice.quizzes 
      LIMIT 10
    `);
    
    console.log('Sample quizzes:', quizzesResult.rows);

    // Check if knowledge_points table exists and has data
    const kpResult = await client.query(`
      SELECT id, topic 
      FROM kedge_practice.knowledge_points 
      LIMIT 10
    `);
    
    console.log('Sample knowledge points:', kpResult.rows);

    // Let's create some associations based on quiz content
    // This is a simplified example - in reality you'd want more sophisticated matching
    const associations = [
      { keyword: '新航路', kp_topic: '新航路的开辟' },
      { keyword: '文艺复兴', kp_topic: '文艺复兴' },
      { keyword: '商朝', kp_topic: '商朝的统治' },
      { keyword: '西周', kp_topic: '西周的政治制度' },
      { keyword: '商鞅变法', kp_topic: '商鞅变法' },
      { keyword: '孔子', kp_topic: '孔子的思想' },
      { keyword: '秦统一', kp_topic: '秦统一的条件和过程' },
      { keyword: '焚书坑儒', kp_topic: '焚书坑儒' },
      { keyword: '文景之治', kp_topic: '"文景之治"' },
      { keyword: '科举', kp_topic: '科举制' },
      { keyword: '王安石', kp_topic: '王安石变法的目的与内容' },
      { keyword: '虎门销烟', kp_topic: '虎门销烟' },
      { keyword: '五四运动', kp_topic: '五四运动' },
      { keyword: '旧石器', kp_topic: '旧石器时代与新石器文明' },
      { keyword: '新石器', kp_topic: '旧石器时代与新石器文明' },
    ];

    let updatedCount = 0;
    
    for (const assoc of associations) {
      // Find knowledge point by topic
      const kpQuery = await client.query(
        `SELECT id FROM kedge_practice.knowledge_points WHERE topic = $1`,
        [assoc.kp_topic]
      );
      
      if (kpQuery.rows.length > 0) {
        const kpId = kpQuery.rows[0].id;
        
        // Update quizzes that contain the keyword
        const updateResult = await client.query(
          `UPDATE kedge_practice.quizzes 
           SET knowledge_point_id = $1 
           WHERE question ILIKE $2 AND knowledge_point_id IS NULL`,
          [kpId, '%' + assoc.keyword + '%']
        );
        
        if (updateResult.rowCount > 0) {
          console.log(`Associated ${updateResult.rowCount} quizzes containing "${assoc.keyword}" with knowledge point "${assoc.kp_topic}"`);
          updatedCount += updateResult.rowCount;
        }
      }
    }

    console.log(`\nTotal quizzes updated: ${updatedCount}`);

    // Verify the associations
    const verifyResult = await client.query(`
      SELECT 
        COUNT(*) as total_quizzes,
        COUNT(knowledge_point_id) as quizzes_with_kp,
        COUNT(*) - COUNT(knowledge_point_id) as quizzes_without_kp
      FROM kedge_practice.quizzes
    `);
    
    console.log('\nQuiz statistics after update:', verifyResult.rows[0]);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

associateQuizzes();