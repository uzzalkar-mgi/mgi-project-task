// Minimal inline-SVG icon set for the app shell (stroke-based, 24x24).
// Mirrors the role of mgi-connect-frontend's Icon component.

const PATHS = {
    dashboard: 'M4 5a1 1 0 011-1h5v7H4V5zm0 8h6v6H5a1 1 0 01-1-1v-5zm10-9h5a1 1 0 011 1v5h-6V4zm0 8h6v6a1 1 0 01-1 1h-5v-7z',
    projects: 'M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z',
    tasks: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9 2 2 4-4',
    timeline: 'M8 7V3m8 4V3M4 11h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z',
    team: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a3 3 0 10-2-5.24',
    milestones: 'M12 2l2.5 5 5.5.8-4 3.9.9 5.5L12 14.8 7.1 17.2l.9-5.5-4-3.9 5.5-.8L12 2z',
    reports: 'M9 17V9m4 8V5m4 12v-6M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z',
    bell: 'M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-4-5.7V5a2 2 0 10-4 0v.3A6 6 0 006 11v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
    gear: 'M10.3 3.3a1 1 0 011.4 0l.8.8a1 1 0 00.9.3l1.1-.2a1 1 0 011.1.7l.4 1a1 1 0 00.7.7l1 .4a1 1 0 01.7 1.1l-.2 1.1a1 1 0 00.3.9l.8.8a1 1 0 010 1.4l-.8.8a1 1 0 00-.3.9l.2 1.1a1 1 0 01-.7 1.1l-1 .4a1 1 0 00-.7.7l-.4 1a1 1 0 01-1.1.7l-1.1-.2a1 1 0 00-.9.3l-.8.8a1 1 0 01-1.4 0l-.8-.8a1 1 0 00-.9-.3l-1.1.2a1 1 0 01-1.1-.7l-.4-1a1 1 0 00-.7-.7l-1-.4a1 1 0 01-.7-1.1l.2-1.1a1 1 0 00-.3-.9l-.8-.8a1 1 0 010-1.4l.8-.8a1 1 0 00.3-.9l-.2-1.1a1 1 0 01.7-1.1l1-.4a1 1 0 00.7-.7l.4-1a1 1 0 011.1-.7l1.1.2a1 1 0 00.9-.3l.8-.8zM12 15a3 3 0 100-6 3 3 0 000 6z',
    user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM4 21c0-4 3.6-7 8-7s8 3 8 7',
    logout: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
    chevron: 'm6 9 6 6 6-6',
    menu: 'M4 6h16M4 12h16M4 18h16',
    search: 'M21 21l-4.3-4.3M11 19a8 8 0 100-16 8 8 0 000 16z',
    plus: 'M12 5v14M5 12h14',
    check: 'M5 12l5 5L20 7',
    x: 'M6 6l12 12M18 6L6 18',
    save: 'M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8',
    eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z M12 15a3 3 0 100-6 3 3 0 000 6z',
    edit: 'M12 20h9 M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z',
    trash: 'M3 6h18 M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2 M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6 M10 11v6 M14 11v6',
    power: 'M12 2v10 M18.4 6.6a9 9 0 11-12.8 0',
};

export function Icon({ name, className = 'h-5 w-5' }) {
    const d = PATHS[name] ?? PATHS.dashboard;
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d={d} />
        </svg>
    );
}
