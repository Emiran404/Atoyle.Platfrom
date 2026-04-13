import { getData, setData } from '../server/utils/storage.js';
import { hashPassword } from '../server/utils/crypto.js';

const createDemoUsers = () => {
  // Test Teacher
  const teachers = getData('teachers') || [];
  const testTeacher = {
    id: 'demo_teacher_id',
    username: 'demo_teacher',
    fullName: 'Demo Teacher',
    department: 'Testing',
    password: hashPassword('123456', 'demo_teacher'),
    createdAt: new Date().toISOString(),
    lastLogin: null
  };
  
  if (!teachers.find(t => t.username === 'demo_teacher')) {
    teachers.push(testTeacher);
    setData('teachers', teachers);
    console.log('✅ Demo Teacher created: demo_teacher / 123456');
  }

  // Test Student
  const students = getData('students') || [];
  const testStudent = {
    id: 'demo_student_id',
    studentNumber: '9999',
    fullName: 'Demo Student',
    className: '11-B',
    password: hashPassword('123456', '9999'),
    folderPath: '11-B ogrenciler/Demo Student-9999',
    createdAt: new Date().toISOString(),
    lastLogin: null,
    ipHistory: []
  };

  if (!students.find(s => s.studentNumber === '9999')) {
    students.push(testStudent);
    setData('students', students);
    console.log('✅ Demo Student created: 9999 / 123456');
  }
};

createDemoUsers();
