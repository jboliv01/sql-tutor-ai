// 'use client';

// import React, { useState } from 'react';
// import TabNavigation from '../TabNavigation';
// import ChatTab from '../components/features/chat/ChatTab';
// import QueryTab from '../components/features/query/QueryTab';
// import PracticeSection from '../components/features/practice/PracticeSection';
// import SubmissionsTab from '../components/features/submissions/SubmissionsTab';

// export default function Home() {
//   const [activeTab, setActiveTab] = useState('chat');

//   return (
//     <div className="space-y-6">
//       <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
//       <div className="bg-white rounded-xl shadow-lg p-6">
//         {activeTab === 'chat' && <ChatTab />}
//         {activeTab === 'query' && <QueryTab />}
//         {activeTab === 'practice' && <PracticeSection />}
//         {activeTab === 'submissions' && <SubmissionsTab />}
//       </div>
//     </div>
//   );
// }