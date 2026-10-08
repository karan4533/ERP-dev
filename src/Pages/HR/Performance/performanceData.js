export const REVIEW_PERIODS = ['H1 2026', 'H2 2025', 'H1 2025', 'Annual 2025']

export const performanceRatingBadgeColor = (rating) => {
    if (rating >= 4.5) return 'bg-[#4CAF5033] text-[#4CAF50]'
    if (rating >= 3.5) return 'bg-[#2196F333] text-[#2196F3]'
    if (rating >= 2.5) return 'bg-[#FF980033] text-[#FF9800]'
    return 'bg-[#FF572233] text-[#FF5722]'
}

export const PERFORMANCE_REVIEWS = [
    {
        id: 'PR-2026-006',
        reviewPeriod: 'H1 2026',
        employee: 'Priya Sharma',
        employeeId: 'EMP-2026-001',
        reviewer: 'Dr. Meera Kapoor (Principal)',
        rating: 4.8,
        comments: 'Consistently high student outcomes. Mentors junior faculty effectively.',
        goals: 'Lead curriculum revision for Grade 10 Mathematics; conduct 2 peer observation sessions.',
        developmentPlan: 'Advanced pedagogy workshop; consider HOD track in next cycle.',
    },
    {
        id: 'PR-2026-005',
        reviewPeriod: 'H1 2026',
        employee: 'Rahul Mehta',
        employeeId: 'EMP-2026-002',
        reviewer: 'Rajesh Verma (Admin Head)',
        rating: 4.2,
        comments: 'Reliable accounts processing. Timely fee reconciliation and audit support.',
        goals: 'Automate monthly expense reports; reduce reconciliation turnaround by 20%.',
        developmentPlan: 'Tally advanced certification; cross-training on payroll module.',
    },
    {
        id: 'PR-2026-004',
        reviewPeriod: 'H1 2026',
        employee: 'Anita Desai',
        employeeId: 'EMP-2026-003',
        reviewer: 'Rajesh Verma (Admin Head)',
        rating: 4.5,
        comments: 'Strong recruitment pipeline management. Smooth onboarding coordination.',
        goals: 'Reduce time-to-hire by 15%; implement digital document workflow.',
        developmentPlan: 'SHRM fundamentals course; shadow payroll processing.',
    },
    {
        id: 'PR-2026-003',
        reviewPeriod: 'H1 2026',
        employee: 'Vikram Singh',
        employeeId: 'EMP-2026-004',
        reviewer: 'Rajesh Verma (Admin Head)',
        rating: 3.8,
        comments: 'Good fleet uptime. Route optimization needs improvement.',
        goals: 'Zero safety incidents; GPS tracking rollout for all buses.',
        developmentPlan: 'Defensive driving refresher; fleet management software training.',
    },
    {
        id: 'PR-2026-002',
        reviewPeriod: 'H1 2026',
        employee: 'Sneha Patel',
        employeeId: 'EMP-2026-005',
        reviewer: 'Dr. Meera Kapoor (Principal)',
        rating: 4.0,
        comments: 'Engaging science lab sessions. Active in science fair coordination.',
        goals: 'Introduce 3 new practical experiments; publish student project guide.',
        developmentPlan: 'STEM educator certification; attend national science teachers meet.',
    },
    {
        id: 'PR-2026-001',
        reviewPeriod: 'H1 2026',
        employee: 'Arjun Nair',
        employeeId: 'EMP-2026-006',
        reviewer: 'IT Support Manager',
        rating: 3.2,
        comments: 'Handles routine tickets well. Needs improvement on escalation documentation.',
        goals: 'Close 95% tickets within SLA; complete network basics certification.',
        developmentPlan: 'Structured mentoring with senior engineer; weekly ticket review sessions.',
    },
]
