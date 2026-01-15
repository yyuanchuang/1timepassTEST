import React, { useState, useEffect } from 'react';
import { Application, User, MasterItem, AppStatus } from '../types';
import { MockService } from '../services/mockDb';
import { Printer, Filter, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  user: User;
}

const Summary: React.FC<Props> = ({ user }) => {
  const [apps, setApps] = useState<Application[]>([]);
  const [items, setItems] = useState<MasterItem[]>([]);
  const navigate = useNavigate();
  
  const [filterQuarter, setFilterQuarter] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => {
    Promise.all([MockService.getApplications(), MockService.getItems()])
      .then(([appData, itemData]) => {
        let visibleApps = appData;
        if (user.role === 'WORKER') {
          visibleApps = appData.filter(a => a.workstation === user.workstation);
        }
        setApps(visibleApps);
        setItems(itemData);
      });
  }, [user]);

  const getItemDetails = (id: string) => items.find(i => i.id === id);

  const getFilteredApps = () => {
    return apps.filter(app => {
      const matchStatus = filterStatus === 'ALL' || app.status === filterStatus;
      let matchQuarter = true;
      if (filterQuarter !== 'ALL') {
        const month = new Date(app.submitDate).getMonth() + 1;
        if (filterQuarter === 'Q1') matchQuarter = month >= 1 && month <= 3;
        if (filterQuarter === 'Q2') matchQuarter = month >= 4 && month <= 6;
        if (filterQuarter === 'Q3') matchQuarter = month >= 7 && month <= 9;
        if (filterQuarter === 'Q4') matchQuarter = month >= 10 && month <= 12;
      }
      return matchStatus && matchQuarter;
    });
  };

  const filteredApps = getFilteredApps();

  const handlePrint = () => {
    window.print();
  };

  const StatusBadge = ({ status }: { status: AppStatus }) => {
    const styles = {
      [AppStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
      [AppStatus.APPROVED]: 'bg-green-100 text-green-800',
      [AppStatus.REJECTED]: 'bg-red-100 text-red-800',
    };
    const text = {
      [AppStatus.PENDING]: '審核中',
      [AppStatus.APPROVED]: '已核准',
      [AppStatus.REJECTED]: '已退回',
    };
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${styles[status]}`}>
        {text[status]}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center no-print gap-4">
        <h1 className="text-2xl font-bold text-gray-800">
            {user.role === 'GUEST' ? '全廠匯總 (訪客)' : '申請單匯總'}
        </h1>
        <div className="flex gap-2">
          <button 
            onClick={handlePrint}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
          >
            <Printer className="h-4 w-4 mr-2" /> 列印報表
          </button>
        </div>
      </div>

      {/* High Contrast Color Scheme */}
      <div className="bg-gray-900 p-4 rounded-lg shadow-sm border border-gray-800 no-print">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 text-white">
            <Filter className="h-4 w-4" /> <span className="text-sm font-bold uppercase tracking-wide">篩選條件:</span>
          </div>
          <select 
            className="block border-2 border-gray-600 rounded bg-gray-800 text-white text-sm focus:ring-2 focus:ring-white focus:border-white font-medium"
            value={filterQuarter}
            onChange={(e) => setFilterQuarter(e.target.value)}
          >
            <option value="ALL">所有季度</option>
            <option value="Q1">第一季 (1-3月)</option>
            <option value="Q2">第二季 (4-6月)</option>
            <option value="Q3">第三季 (7-9月)</option>
            <option value="Q4">第四季 (10-12月)</option>
          </select>

          <select
            className="block border-2 border-gray-600 rounded bg-gray-800 text-white text-sm focus:ring-2 focus:ring-white focus:border-white font-medium"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">所有狀態</option>
            <option value={AppStatus.APPROVED}>已核准</option>
            <option value={AppStatus.PENDING}>審核中</option>
            <option value={AppStatus.REJECTED}>已退回</option>
          </select>
        </div>
      </div>

      {/* Printable Sheet */}
      <div className="bg-white shadow sm:rounded-lg overflow-hidden print:overflow-visible print:shadow-none print:w-full">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center print:border-b-2 print:border-gray-800">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {user.role === 'ADMIN' || user.role === 'GUEST' ? '所有工作站' : `工作站: ${user.workstation}`}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 print:text-black">
              產表日期: {new Date().toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
             <span className="block text-xs text-gray-500 print:text-black">下次結算日</span>
             <span className="font-bold text-gray-700 print:text-black">
               {filteredApps.length > 0 && filteredApps[0].summaryDate 
                 ? filteredApps[0].summaryDate 
                 : 'N/A'}
             </span>
          </div>
        </div>
        
        <div className="overflow-x-auto print:overflow-visible">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">表單編號</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">日期</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">項目</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black w-1/3">銲道明細 (圖號#流水號-銲道)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">分配</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">總計</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">狀態</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider no-print">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-sm">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-gray-500">
                    無符合篩選條件的申請單。
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => {
                  const item = getItemDetails(app.masterItemId);
                  const total = app.allocations.reduce((s, a) => s + a.amount, 0);
                  const canEdit = user.role === 'WORKER' && app.status === AppStatus.PENDING;

                  return (
                    <tr key={app.id} className={app.status === AppStatus.REJECTED ? 'bg-red-50 print:bg-transparent' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 align-top">{app.sheetNo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 print:text-black align-top">{app.submitDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 print:text-black align-top">
                        <div className="font-medium">{item?.itemName}</div>
                        <div className="text-xs">[{item?.category}]</div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 print:text-black align-top">
                         <div className="flex flex-col gap-1">
                           {app.items.map((i, idx) => (
                              <div key={idx} className="text-[10px] sm:text-xs font-mono border-b border-gray-100 last:border-0 pb-1 break-all">
                                 {`${i.drawingNo}#${i.itemSerial || '000'}-${i.weldNo}`}
                              </div>
                           ))}
                         </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 print:text-black align-top">
                        <ul className="list-disc list-inside text-xs">
                          {app.allocations.map((a, idx) => (
                             <li key={idx}>{a.workerName}: ${a.amount.toLocaleString()}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900 align-top">${total.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center align-top">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium no-print align-top">
                        {canEdit && (
                          <button
                            onClick={() => navigate(`/?id=${app.id}`)}
                            className="text-brand-600 hover:text-brand-900 flex items-center justify-end w-full"
                          >
                            <Edit className="h-4 w-4 mr-1" /> 編輯
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Summary;