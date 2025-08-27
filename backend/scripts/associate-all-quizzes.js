const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.NODE_DATABASE_URL || process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/kedge_db'
});

async function associateAllQuizzes() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Get all knowledge points
    const kpResult = await client.query(`
      SELECT id, topic FROM kedge_practice.knowledge_points
    `);
    
    const knowledgePoints = {};
    kpResult.rows.forEach(row => {
      knowledgePoints[row.topic] = row.id;
    });
    
    console.log(`Found ${Object.keys(knowledgePoints).length} knowledge points`);

    // Define associations based on quiz content
    const associations = [
      // Historical topics
      { keywords: ['1500', '新航路', '达·伽马', '哥伦布', '航海'], kpId: knowledgePoints['旧石器时代与新石器文明'] || null },
      { keywords: ['商朝', '商代'], kpId: knowledgePoints['商朝的统治'] },
      { keywords: ['西周'], kpId: knowledgePoints['西周的政治制度'] },
      { keywords: ['商鞅'], kpId: knowledgePoints['商鞅变法'] },
      { keywords: ['孔子'], kpId: knowledgePoints['孔子的思想'] },
      { keywords: ['秦', '统一'], kpId: knowledgePoints['秦统一的条件和过程'] },
      { keywords: ['焚书坑儒'], kpId: knowledgePoints['焚书坑儒'] },
      { keywords: ['文景'], kpId: knowledgePoints['"文景之治"'] },
      { keywords: ['科举'], kpId: knowledgePoints['科举制'] },
      { keywords: ['王安石'], kpId: knowledgePoints['王安石变法的目的与内容'] },
      { keywords: ['虎门', '林则徐'], kpId: knowledgePoints['虎门销烟'] },
      { keywords: ['五四'], kpId: knowledgePoints['五四运动'] },
    ];

    // Get all quizzes
    const quizzesResult = await client.query(`
      SELECT id, question FROM kedge_practice.quizzes
    `);
    
    console.log(`Found ${quizzesResult.rows.length} quizzes to process`);

    let totalUpdated = 0;
    
    // For each quiz, try to find a matching knowledge point
    for (const quiz of quizzesResult.rows) {
      let matched = false;
      
      for (const assoc of associations) {
        if (!assoc.kpId) continue;
        
        // Check if any keyword matches the quiz question
        const hasKeyword = assoc.keywords.some(keyword => 
          quiz.question.toLowerCase().includes(keyword.toLowerCase())
        );
        
        if (hasKeyword && !matched) {
          const updateResult = await client.query(
            `UPDATE kedge_practice.quizzes 
             SET knowledge_point_id = $1::text 
             WHERE id = $2`,
            [assoc.kpId, quiz.id]
          );
          
          if (updateResult.rowCount > 0) {
            console.log(`✓ Associated quiz "${quiz.question.substring(0, 40)}..." with knowledge point`);
            totalUpdated++;
            matched = true;
          }
        }
      }
      
      if (!matched) {
        // If no specific match, assign to a default knowledge point (first one)
        const defaultKpId = kpResult.rows[0]?.id;
        if (defaultKpId) {
          await client.query(
            `UPDATE kedge_practice.quizzes 
             SET knowledge_point_id = $1::text 
             WHERE id = $2`,
            [defaultKpId, quiz.id]
          );
          console.log(`✓ Assigned quiz "${quiz.question.substring(0, 40)}..." to default knowledge point`);
          totalUpdated++;
        }
      }
    }

    console.log(`\n✅ Updated ${totalUpdated} quizzes with knowledge points`);

    // Verify the results
    const verifyResult = await client.query(`
      SELECT 
        kp.topic,
        COUNT(q.id) as quiz_count
      FROM kedge_practice.knowledge_points kp
      LEFT JOIN kedge_practice.quizzes q ON q.knowledge_point_id = kp.id::text
      GROUP BY kp.id, kp.topic
      HAVING COUNT(q.id) > 0
      ORDER BY quiz_count DESC
    `);
    
    console.log('\nKnowledge points with associated quizzes:');
    verifyResult.rows.forEach(row => {
      console.log(`  ${row.topic}: ${row.quiz_count} quizzes`);
    });

    // Check overall statistics
    const stats = await client.query(`
      SELECT 
        COUNT(*) as total_quizzes,
        COUNT(knowledge_point_id) as quizzes_with_kp
      FROM kedge_practice.quizzes
    `);
    
    console.log('\nFinal statistics:', stats.rows[0]);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

associateAllQuizzes();