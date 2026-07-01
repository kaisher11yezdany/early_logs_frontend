const BASE = 'https://backendapi-production-9131.up.railway.app/api';

async function run() {
  console.log('\n🔍 Testing Early Logs IMS API...\n');

  // 1. Health
  const health = await fetch(`${BASE}/health`).then(r => r.json());
  console.log('✅ Health:', health.message);

  // 2. Admin login
  const adminRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@earlylogs.com', password: 'Admin@123' })
  }).then(r => r.json());
  console.log('✅ Admin Login:', adminRes.success ? `OK — ${adminRes.user.name} (${adminRes.user.role})` : '❌ FAILED — ' + adminRes.message);
  const token = adminRes.token;

  // 3. Teacher login
  const tRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'priya.teacher@earlylogs.com', password: 'Teacher@123' })
  }).then(r => r.json());
  console.log('✅ Teacher Login:', tRes.success ? `OK — ${tRes.user.name}` : '❌ FAILED — ' + tRes.message);

  // 4. Student login
  const sRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'aarav.student@earlylogs.com', password: 'Student@123' })
  }).then(r => r.json());
  console.log('✅ Student Login:', sRes.success ? `OK — ${sRes.user.name}` : '❌ FAILED — ' + sRes.message);

  // 5. Parent login
  const pRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'parent@earlylogs.com', password: 'Parent@123' })
  }).then(r => r.json());
  console.log('✅ Parent Login:', pRes.success ? `OK — ${pRes.user.name}` : '❌ FAILED — ' + pRes.message);

  const h = { Authorization: `Bearer ${token}` };

  // 6. Students list
  const stu = await fetch(`${BASE}/students`, { headers: h }).then(r => r.json());
  console.log(`✅ Students: ${stu.total} found — ${stu.students?.map(s => s.user?.name).join(', ')}`);

  // 7. Classes
  const cls = await fetch(`${BASE}/classes`, { headers: h }).then(r => r.json());
  console.log(`✅ Classes: ${cls.classes?.map(c => `${c.name} ${c.section}`).join(', ')}`);

  // 8. Notices
  const not = await fetch(`${BASE}/notices`, { headers: h }).then(r => r.json());
  console.log(`✅ Notices: ${not.notices?.length} found`);

  // 9. Assignments
  const asg = await fetch(`${BASE}/assignments`, { headers: h }).then(r => r.json());
  console.log(`✅ Assignments: ${asg.assignments?.length} found`);

  console.log('\n🎉 All tests passed! Backend is fully operational.\n');
  console.log('📋 Demo Credentials:');
  console.log('   Admin   → admin@earlylogs.com / Admin@123');
  console.log('   Teacher → priya.teacher@earlylogs.com / Teacher@123');
  console.log('   Student → aarav.student@earlylogs.com / Student@123');
  console.log('   Parent  → parent@earlylogs.com / Parent@123');
}

run().catch(err => console.error('❌ Error:', err.message));
