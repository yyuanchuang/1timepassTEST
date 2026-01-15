import React, { useState, useEffect } from 'react';
import { Application, MasterItem, AppStatus, User, UserStatus } from '../types';
import { MockService } from '../services/mockDb';
import { Check, X, Search, Users, FileText, ChevronDown, ChevronUp, Save } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'APPS' | 'USERS'>('APPS');
  
  // Data
  const [apps, setApps] = useState<Application[]>([]);
  const [items, setItems] = useState<MasterItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // Expanded State
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);
  const [adminComments, setAdminComments] = useState<Record<string, string>>({});

  const loadData = () => {
    Promise.all([MockService.getApplications(), MockService.getItems(), MockService.getUsers()])
      .then(([appData, itemData, userData]) => {
        // Sort by date desc
        const sortedApps = appData.sort((a, b) => new Date(b.submitDate).getTime() - new Date(a.submitDate).getTime());
        setApps(sortedApps);
        setItems(itemData);
        setUsers(userData);
        
        // Initialize comments state
        const initialComments: Record<string, string> = {};
        sortedApps.forEach(app => {
            if (app.adminComment) initialComments[app.id] = app.adminComment;
        });
        setAdminComments(initialComments);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAppStatusChange = async (appId: string, status: AppStatus) => {
    const comment = adminComments[appId];
    if (status === AppStatus.REJECTED && !comment) {
      alert("請在備註欄填寫退回原因。");
      return;
    }
    await MockService.updateStatus(appId, status, comment);
    loadData();
    if (status !== AppStatus.PENDING) setExpandedAppId(null); // Close on success
  };

  const handleSaveComment = async (appId: string) => {
      const comment = adminComments[appId];
      // We can update the comment without changing status if status is already set, 
      // or just update the object in local state until status changes. 
      // For persistent storage without status change, we reuse updateStatus with current status.
      const app = apps.find(a => a.id === appId);
      if (app) {
          await MockService.updateStatus(appId, app.status, comment);
          alert("備註已儲存。");
          loadData();
      }
  };

  const handleUserApproval = async (userId: string) => {
    await MockService.approveUser(userId);
    loadData();
  };

  const getItemName = (id: string) => items.find(i => i.id === id)?.itemName || 'Unknown';
  const getItemDetails = (id: string) => items.find(i => i.id === id);

  const toggleExpand = (id: string) => {
      if (expandedAppId === id) setExpandedAppId(null);
      else setExpandedAppId(id);
  };

  const filteredApps = apps.filter(a => 
    a.sheetNo.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.items.some(i => i.weldNo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const pendingUsers = users.filter(u => u.status === UserStatus.PENDING);

  // Status mapping
  const statusText = {
    [AppStatus.PENDING]: '審核中',
    [AppStatus.APPROVED]: '已核准',
    [AppStatus.REJECTED]: '已退回',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
         <h1 className="text-2xl font-bold text-gray-800">管理員儀表板</h1>
         
         {/* Tabs */}
         <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg mt-4 md:mt-0">
           <button
             onClick={() => setActiveTab('APPS')}
             className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
               activeTab === 'APPS' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:bg-gray-300'
             }`}
           >
             <FileText className="h-4 w-4 mr-2" /> 申請單管理
           </button>
           <button
             onClick={() => setActiveTab('USERS')}
             className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
               activeTab === 'USERS' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:bg-gray-300'
             }`}
           >
             <Users className="h-4 w-4 mr-2" /> 
             使用者審核
             {pendingUsers.length > 0 && (
               <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingUsers.length}</span>
             )}
           </button>
         </div>
      </div>

      {activeTab === 'APPS' && (
        <div className="space-y-6">
          {/* Search */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center gap-4">
            <Search className="h-5 w-5 text-gray-400" />
            <input 
              type="text"
              placeholder="搜尋表單編號、申請人或銲道編號..."
              className="flex-1 border-none focus:ring-0 text-sm bg-white text-gray-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* List */}
          <div className="grid gap-4">
            {filteredApps.length === 0 ? (
              <div className="text-center py-10 text-gray-500">找不到申請單。</div>
            ) : (
              filteredApps.map(app => {
                  const isExpanded = expandedAppId === app.id;
                  const itemInfo = getItemDetails(app.masterItemId);

                  return (
                <div key={app.id} className={`bg-white rounded-lg shadow transition-all ${
                  app.status === AppStatus.PENDING ? 'border-l-4 border-yellow-400' : 
                  app.status === AppStatus.APPROVED ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'
                }`}>
                  {/* Summary Header - Click to Expand */}
                  <div 
                    className="p-4 cursor-pointer flex justify-between items-center"
                    onClick={() => toggleExpand(app.id)}
                  >
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono font-bold text-gray-800">{app.sheetNo}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                            app.status === AppStatus.PENDING ? 'bg-yellow-100 text-yellow-800' :
                            app.status === AppStatus.APPROVED ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {statusText[app.status]}
                            </span>
                            <span className="text-gray-500 text-sm">| {app.submitDate}</span>
                        </div>
                        <h3 className="text-base font-semibold text-gray-900">{itemInfo?.itemName}</h3>
                        <div className="text-sm text-gray-500">
                             申請人: <span className="font-medium text-gray-700">{app.applicantName}</span> ({app.workstation})
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <div className="text-xs text-gray-500">獎金總額</div>
                            <div className="font-bold text-gray-900">${app.allocations.reduce((s,x)=>s+x.amount,0).toLocaleString()}</div>
                        </div>
                        {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-400"/> : <ChevronDown className="h-5 w-5 text-gray-400"/>}
                    </div>
                  </div>

                  {/* Expanded Detail View */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 p-4 bg-gray-50 rounded-b-lg">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left: Weld Details */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">包含銲道 (確認 UT)</h4>
                                <div className="bg-white border rounded overflow-hidden">
                                    <table className="min-w-full text-xs text-left">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="px-3 py-2 border-b">流水號</th>
                                                <th className="px-3 py-2 border-b">銲道編號</th>
                                                <th className="px-3 py-2 border-b">重量</th>
                                                <th className="px-3 py-2 border-b font-bold text-blue-800">UT 日期</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {app.items.map((item, idx) => (
                                                <tr key={idx} className="border-b last:border-0">
                                                    <td className="px-3 py-2 font-mono">{item.itemSerial}</td>
                                                    <td className="px-3 py-2 font-medium">{item.weldNo}</td>
                                                    <td className="px-3 py-2 text-gray-500">{item.weight}g</td>
                                                    <td className="px-3 py-2 font-bold text-blue-600">
                                                        {item.utDate || <span className="text-red-400 italic">缺漏</span>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Right: Allocation & Actions */}
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">分配明細</h4>
                                    <div className="bg-white border rounded p-3 text-xs space-y-1">
                                        {app.allocations.map((alloc, i) => (
                                            <div key={i} className="flex justify-between border-b border-dashed last:border-0 pb-1 mb-1">
                                                <span>{alloc.workerName} <span className="text-gray-400">({alloc.role === 'WELDER' ? '銲工' : '領班'})</span></span>
                                                <span className="font-medium">${alloc.amount.toLocaleString()}</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between pt-2 font-bold text-sm">
                                            <span>總計</span>
                                            <span>${app.allocations.reduce((s,a)=>s+a.amount,0).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Comment Section */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">管理員備註 / 退回原因</label>
                                    <div className="flex gap-2">
                                        <textarea
                                            className="w-full border-gray-300 rounded-md text-sm shadow-sm focus:ring-brand-500 focus:border-brand-500"
                                            rows={2}
                                            placeholder="在此輸入備註..."
                                            value={adminComments[app.id] || ''}
                                            onChange={(e) => setAdminComments({ ...adminComments, [app.id]: e.target.value })}
                                        />
                                        <button 
                                          onClick={() => handleSaveComment(app.id)}
                                          className="flex items-center justify-center p-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition-colors"
                                          title="儲存備註"
                                        >
                                            <Save className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-2">
                                    {app.status === AppStatus.PENDING && (
                                        <>
                                            <button
                                                onClick={() => handleAppStatusChange(app.id, AppStatus.APPROVED)}
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded text-sm font-medium shadow-sm transition-colors"
                                            >
                                                <Check className="h-4 w-4 inline mr-1" /> 核准
                                            </button>
                                            <button
                                                onClick={() => handleAppStatusChange(app.id, AppStatus.REJECTED)}
                                                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded text-sm font-medium shadow-sm transition-colors"
                                            >
                                                <X className="h-4 w-4 inline mr-1" /> 退回
                                            </button>
                                        </>
                                    )}
                                    {app.status !== AppStatus.PENDING && (
                                        <button
                                            onClick={() => handleAppStatusChange(app.id, AppStatus.PENDING)}
                                            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded text-sm font-medium shadow-sm transition-colors"
                                        >
                                            重置為審核中
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                  )}
                </div>
              );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'USERS' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">待審核使用者註冊</h3>
          </div>
          {pendingUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">無待審核使用者。</div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {pendingUsers.map(user => (
                <li key={user.id} className="px-6 py-4 hover:bg-gray-50">
                   <div className="flex items-center justify-between">
                     <div>
                       <h4 className="text-sm font-bold text-gray-900">{user.name}</h4>
                       <p className="text-sm text-gray-500">使用者名稱: {user.id}</p>
                       <p className="text-sm text-gray-500">工作站: <span className="font-mono bg-gray-100 px-1 rounded">{user.workstation}</span></p>
                     </div>
                     <div className="flex gap-2">
                       <button
                         onClick={() => handleUserApproval(user.id)}
                         className="flex items-center px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700"
                       >
                         <Check className="h-3 w-3 mr-1" /> 啟用
                       </button>
                     </div>
                   </div>
                </li>
              ))}
            </ul>
          )}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 mt-4">
             <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">所有啟用使用者</h4>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {users.filter(u => u.status === UserStatus.ACTIVE).map(u => (
                  <div key={u.id} className="text-xs bg-white border p-2 rounded flex justify-between">
                    <span>{u.name}</span>
                    <span className="text-gray-400">{u.role}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;