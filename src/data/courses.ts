import { Course } from '@/types/course';

export const courses: Course[] = [
  {
    id: '1',
    title: 'CFP® Certification Exam Preparation',
    description: 'Comprehensive preparation course for the CFP® certification examination. This course covers all major topics and includes practice exams.',
    type: ['CFP'],
    price: 799.00,
    duration: '40 hours',
    credits: 40,
    features: [
      'Complete exam preparation materials',
      'Practice questions and mock exams',
      'Live instructor support',
      'Study planning tools',
      '12-month access'
    ],
    slug: 'cfp-certification-exam-prep',
    objectives: [
      'Master the CFP® exam content',
      'Develop test-taking strategies',
      'Practice with real exam-style questions',
      'Understand key financial planning concepts'
    ],
    instructor: {
      name: 'John Smith',
      bio: 'CFP® professional with 20+ years of experience in financial planning and education.',
      image: '/images/instructors/john-smith.jpg'
    },
    creditsByType: {
      'CFP': 40
    }
  },
  {
    id: '2',
    title: 'Tax Planning Strategies for CPAs',
    description: 'Advanced tax planning strategies for CPAs working with high-net-worth individuals and small businesses.',
    type: ['CPA', 'IRS'],
    price: 399.00,
    duration: '16 hours',
    credits: 16,
    features: [
      'Real-world case studies',
      'Latest tax law updates',
      'Downloadable resources',
      'Expert instructor support',
      '6-month access'
    ],
    slug: 'tax-planning-strategies',
    objectives: [
      'Implement advanced tax planning strategies',
      'Navigate complex tax scenarios',
      'Optimize client tax positions',
      'Stay current with tax law changes'
    ],
    instructor: {
      name: 'Sarah Johnson',
      bio: 'CPA with expertise in tax planning and wealth management.',
      image: '/images/instructors/sarah-johnson.jpg'
    },
    creditsByType: {
      'CPA': 14,
      'IRS': 2
    }
  },
  {
    id: '3',
    title: 'Ethics for Financial Professionals',
    description: 'Essential ethics course covering professional responsibilities and ethical decision-making in financial services.',
    type: ['CFP', 'CPA', 'IRS'],
    price: 199.00,
    duration: '4 hours',
    credits: 4,
    features: [
      'Interactive case studies',
      'Real-world scenarios',
      'Certificate of completion',
      'Instant access',
      '3-month access'
    ],
    slug: 'ethics-for-financial-professionals',
    objectives: [
      'Understand ethical responsibilities',
      'Apply ethical decision-making frameworks',
      'Identify and resolve ethical dilemmas',
      'Meet continuing education requirements'
    ],
    instructor: {
      name: 'Michael Chen',
      bio: 'Ethics expert and former regulatory compliance officer.',
      image: '/images/instructors/michael-chen.jpg'
    },
    creditsByType: {
      'CFP': 2,
      'CPA': 2,
      'IRS': 2
    }
  }
]; 