const { Client } = require('pg');
const XLSX = require('xlsx');
const path = require('path');

// Remote database connection
const client = new Client({
  connectionString: 'postgres://arthur:arthur@34.84.100.187:5432/arthur-test'
});

async function bootstrapKnowledgePoints() {
  try {
    await client.connect();
    console.log('Connected to remote database');

    // Read Excel file
    const excelPath = path.join(__dirname, '..', 'data', 'knowledge-points.xlsx');
    const workbook = XLSX.readFile(excelPath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Parse knowledge points from Excel
    const knowledgePoints = [];
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || row.length < 6) continue;
      
      const [id, topic, volume, unit, lesson, sub] = row;
      if (!id || !topic) continue;
      
      knowledgePoints.push({
        id: String(id).trim(),
        topic: String(topic).trim(),
        volume: String(volume || '').trim(),
        unit: String(unit || '').trim(),
        lesson: String(lesson || '').trim(),
        sub: String(sub || '').trim(),
      });
    }
    
    console.log(`Found ${knowledgePoints.length} knowledge points in Excel`);

    // Clear existing knowledge points
    await client.query('DELETE FROM kedge_practice.knowledge_points');
    console.log('Cleared existing knowledge points');

    // Insert new knowledge points
    const kpIdMapping = {}; // Map topics to UUIDs
    for (const kp of knowledgePoints) {
      const result = await client.query(
        `INSERT INTO kedge_practice.knowledge_points (topic, volume, unit, lesson, sub)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [kp.topic, kp.volume, kp.unit, kp.lesson, kp.sub]
      );
      const uuid = result.rows[0].id;
      kpIdMapping[kp.topic] = uuid;
      console.log(`Inserted: ${kp.topic} with ID: ${uuid}`);
    }

    console.log(`\nSuccessfully imported ${knowledgePoints.length} knowledge points`);

    // Now associate quizzes with knowledge points based on content
    console.log('\nAssociating quizzes with knowledge points...');
    
    const associations = [
      { keyword: '商朝', topic: '商朝的统治' },
      { keyword: '西周', topic: '西周的政治制度' },
      { keyword: '商鞅', topic: '商鞅变法' },
      { keyword: '孔子', topic: '孔子的思想' },
      { keyword: '秦', topic: '秦统一的条件和过程' },
      { keyword: '焚书坑儒', topic: '焚书坑儒' },
      { keyword: '文景', topic: '"文景之治"' },
      { keyword: '科举', topic: '科举制' },
      { keyword: '王安石', topic: '王安石变法的目的与内容' },
      { keyword: '虎门', topic: '虎门销烟' },
      { keyword: '五四', topic: '五四运动' },
      { keyword: '旧石器', topic: '旧石器时代与新石器文明' },
      { keyword: '新石器', topic: '旧石器时代与新石器文明' },
    ];

    let updatedCount = 0;
    
    for (const assoc of associations) {
      const kpId = kpIdMapping[assoc.topic];
      
      if (kpId) {
        // Update quizzes that contain the keyword
        // Cast UUID to TEXT for comparison
        const updateResult = await client.query(
          `UPDATE kedge_practice.quizzes 
           SET knowledge_point_id = $1::text 
           WHERE question ILIKE $2 AND knowledge_point_id IS NULL`,
          [kpId, '%' + assoc.keyword + '%']
        );
        
        if (updateResult.rowCount > 0) {
          console.log(`Associated ${updateResult.rowCount} quizzes containing "${assoc.keyword}" with "${assoc.topic}"`);
          updatedCount += updateResult.rowCount;
        }
      } else {
        console.log(`Knowledge point not found for topic: ${assoc.topic}`);
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

    // Show some knowledge points with quiz counts
    const kpWithCounts = await client.query(`
      SELECT 
        kp.id,
        kp.topic,
        COUNT(q.id) as quiz_count
      FROM kedge_practice.knowledge_points kp
      LEFT JOIN kedge_practice.quizzes q ON q.knowledge_point_id::uuid = kp.id
      GROUP BY kp.id, kp.topic
      HAVING COUNT(q.id) > 0
      ORDER BY quiz_count DESC
      LIMIT 10
    `);
    
    console.log('\nKnowledge points with associated quizzes:');
    kpWithCounts.rows.forEach(row => {
      console.log(`  ${row.topic}: ${row.quiz_count} quizzes`);
    });

    // Show all knowledge points for verification
    const allKPs = await client.query(`
      SELECT 
        kp.id,
        kp.topic,
        COUNT(q.id) as quiz_count
      FROM kedge_practice.knowledge_points kp
      LEFT JOIN kedge_practice.quizzes q ON q.knowledge_point_id::uuid = kp.id
      GROUP BY kp.id, kp.topic
      ORDER BY kp.topic
    `);
    
    console.log('\nAll knowledge points:');
    allKPs.rows.forEach(row => {
      console.log(`  ${row.topic}: ${row.quiz_count} quizzes`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

bootstrapKnowledgePoints();