import React, { useState, useEffect } from 'react';
import { User, MasterItem, WelderAllocation, Application, AppStatus, ApplicationLineItem } from '../types';
import { MockService } from '../services/mockDb';
import { Plus, Trash2, Save, AlertCircle, CheckCircle2, Calculator, Info, Lock, Printer, FileText, RefreshCw, HandCoins } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useSearchParams, useNavigate } from 'react-router-dom';

interface Props {
  user: User;
}

const ApplicationForm: React.FC<Props> = ({ user }) => {
  const [masterItems, setMasterItems] = useState<MasterItem[]>([]);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editId = searchParams.get('id');

  // Core Form State
  const [sheetNo, setSheetNo] = useState('');
  const [selectedMasterItemId, setSelectedMasterItemId] = useState('');
  const [submitDate, setSubmitDate] = useState('');
  const [componentSerial, setComponentSerial] = useState(''); // Global Item # for the sheet
  
  // Line Items (Welds)
  const [lineItems, setLineItems] = useState<ApplicationLineItem[]>([]);
  
  // Use configName for the dropdown selection
  const [selectedConfig, setSelectedConfig] = useState('');

  // Allocations
  const [allocations, setAllocations] = useState<WelderAllocation[]>([]);
  
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  // Derived State
  const selectedMasterItem = masterItems.find(i => i.id === selectedMasterItemId);
  
  // Get unique configurations (or drawings if configName is missing)
  const availableConfigs = selectedMasterItem 
    ? Array.from(new Set(selectedMasterItem.specs.map(s => s.configName || s.drawingNo))) as string[]
    : [];

  // Budget Calculations
  const totalAllocated = allocations.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
  const totalAwardValue = selectedMasterItem ? selectedMasterItem.basePrice : 0;
  const remainingBudget = totalAwardValue - totalAllocated;

  // Sub-budget checks
  const welderAllocated = allocations.filter(a => a.role === 'WELDER').reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
  const foremanAllocated = allocations.filter(a => a.role === 'FOREMAN').reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
  
  const welderBudget = selectedMasterItem ? selectedMasterItem.welderPrice : 0;
  const foremanBudget = selectedMasterItem ? selectedMasterItem.foremanPrice : 0;

  const isWelderOver = welderAllocated > welderBudget;
  const isForemanOver = foremanAllocated > foremanBudget;
  const isOverBudget = remainingBudget < 0 || isWelderOver || isForemanOver;

  useEffect(() => {
    MockService.getItems().then(setMasterItems);
  }, []);

  // Sync line item serials when global component serial changes
  useEffect(() => {
    if (lineItems.length > 0) {
      setLineItems(prev => prev.map(item => ({ ...item, itemSerial: componentSerial })));
    }
  }, [componentSerial]);

  // Load data if editing
  useEffect(() => {
    if (editId) {
      MockService.getApplicationById(editId).then(app => {
        if (app) {
          setSheetNo(app.sheetNo);
          setSelectedMasterItemId(app.masterItemId);
          setLineItems(app.items);
          setAllocations(app.allocations);
          setSubmitDate(app.submitDate);
          
          if (app.items.length > 0) {
            setComponentSerial(app.items[0].itemSerial || '');
          }
        } else {
          setFeedback({ type: 'error', msg: '找不到申請單。' });
        }
      });
    } else {
      setSubmitDate(new Date().toISOString().split('T')[0]);
    }
  }, [editId]);

  // Logic to populate welds based on selected configuration
  const populateWelds = (item: MasterItem, configName: string) => {
    const specs = item.specs.filter(s => (s.configName || s.drawingNo) === configName);
    const newLines: ApplicationLineItem[] = specs.map(spec => ({
      specId: spec.id,
      drawingNo: spec.drawingNo,
      weldNo: spec.weldNo,
      itemSerial: componentSerial,
      weight: spec.weight,
      price: spec.price,
      utDate: submitDate
    }));
    setLineItems(newLines);
  };

  const handleMasterItemChange = (itemId: string) => {
    setSelectedMasterItemId(itemId);
    const item = masterItems.find(i => i.id === itemId);
    
    // Reset or Set Defaults
    if (item) {
      // 1. Default Config & Welds
      const configs = Array.from(new Set(item.specs.map((s): string => s.configName || s.drawingNo))) as string[];
      const defaultConfig: string = configs.length > 0 ? configs[0] : '';
      setSelectedConfig(defaultConfig);
      if (defaultConfig) {
        populateWelds(item, defaultConfig);
      } else {
        setLineItems([]);
      }

      // 2. Default Allocations (Reset)
      const newAllocations: WelderAllocation[] = [];
      const foremanAmount = Math.floor(item.foremanPrice / (item.defaultForemen || 1));
      for (let i = 0; i < item.defaultForemen; i++) {
        newAllocations.push({
          workerId: String(uuidv4()),
          workerName: '',
          role: 'FOREMAN',
          amount: foremanAmount
        });
      }
      const welderAmount = Math.floor(item.welderPrice / (item.defaultWelders || 1));
      for (let i = 0; i < item.defaultWelders; i++) {
        newAllocations.push({
          workerId: String(uuidv4()),
          workerName: '',
          role: 'WELDER',
          amount: welderAmount
        });
      }
      setAllocations(newAllocations);
    } else {
      setLineItems([]);
      setAllocations([]);
      setSelectedConfig('');
    }
  };

  const handleConfigChange = (configName: string) => {
    setSelectedConfig(configName);
    if (selectedMasterItem) {
      populateWelds(selectedMasterItem, configName);
    }
  };

  const handleRemoveLineItem = (index: number) => {
    const newItems = [...lineItems];
    newItems.splice(index, 1);
    setLineItems(newItems);
  };

  const handleLineItemSerialChange = (index: number, val: string) => {
     const newItems = [...lineItems];
     newItems[index] = { ...newItems[index], itemSerial: val };
     setLineItems(newItems);
  };

  const handleAddWorker = () => {
    setAllocations([...allocations, { workerId: '', workerName: '', role: 'WELDER', amount: 0 }]);
  };

  const handleRemoveWorker = (index: number) => {
    const newAlloc = [...allocations];
    newAlloc.splice(index, 1);
    setAllocations(newAlloc);
  };

  const updateAllocation = (index: number, field: keyof WelderAllocation, value: any) => {
    const newAlloc = [...allocations];
    newAlloc[index] = { ...newAlloc[index], [field]: value };
    setAllocations(newAlloc);
  };

  // Auto-average Distribution
  const handleDistribute = () => {
     if (!selectedMasterItem) return;
     
     const welderCount = allocations.filter(a => a.role === 'WELDER').length;
     const foremanCount = allocations.filter(a => a.role === 'FOREMAN').length;
     
     const welderAvg = welderCount > 0 ? Math.floor(selectedMasterItem.welderPrice / welderCount) : 0;
     const foremanAvg = foremanCount > 0 ? Math.floor(selectedMasterItem.foremanPrice / foremanCount) : 0;

     const newAllocations = allocations.map(a => ({
        ...a,
        amount: a.role === 'WELDER' ? welderAvg : foremanAvg
     }));

     setAllocations(newAllocations);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (lineItems.length === 0) {
      setFeedback({ type: 'error', msg: '未列出銲道。' });
      return;
    }
    if (isOverBudget) {
      let msg = '超過預算。';
      if (isWelderOver) msg = '銲工分配超過銲工預算上限。';
      else if (isForemanOver) msg = '領班分配超過領班預算上限。';
      else if (remainingBudget < 0) msg = '總分配超過總獎金。';
      setFeedback({ type: 'error', msg });
      return;
    }

    setSubmitting(true);
    try {
      let finalSheetNo = sheetNo;
      if (!editId) {
         finalSheetNo = await MockService.generateSheetNo(user.workstation, selectedMasterItemId);
      }

      const appData: Application = {
        id: editId || String(uuidv4()),
        sheetNo: finalSheetNo,
        workstation: user.workstation,
        applicantName: user.name,
        submitDate: submitDate,
        masterItemId: selectedMasterItemId,
        items: lineItems,
        allocations: allocations.map(a => ({...a, amount: Number(a.amount)})),
        status: AppStatus.PENDING
      };

      await MockService.saveApplication(appData);
      
      if (editId) {
         setFeedback({ type: 'success', msg: '申請單更新成功！' });
         setTimeout(() => navigate('/summary'), 1500);
      } else {
         setFeedback({ type: 'success', msg: `申請單已提交！表單編號：${finalSheetNo}` });
         setSheetNo(finalSheetNo);
      }
    } catch (err) {
      setFeedback({ type: 'error', msg: '提交申請失敗。' });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (user.role === 'GUEST') {
    return (
      <div className="text-center py-10 bg-white rounded-lg shadow">
         <h2 className="text-xl font-bold text-gray-700">僅供檢視模式</h2>
      </div>
    );
  }

  // Group items by category for the dropdown
  const groupedItems = masterItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MasterItem[]>);

  // --- Print Layout Component ---
  const PrintLayout = () => {
    if (!selectedMasterItem) return null;
    const serialNo = sheetNo.length > 2 ? `#${sheetNo.slice(-3)}` : '---';
    
    return (
      <div className="hidden print:block p-8 font-serif text-black max-w-[210mm] mx-auto bg-white">
        {/* Header */}
        <div className="flex items-center justify-center mb-6 relative">
          <div className="absolute left-0 top-0">
            <div className="border-2 border-gray-800 w-16 h-16 rounded-full flex items-center justify-center text-xs text-center font-bold leading-tight">
              Wind<br/>Team
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-wider border-b-2 border-black pb-2 px-8">
            關鍵構件一次合格獎金申請單
          </h1>
        </div>

        {/* Info Grid */}
        <div className="flex justify-between text-sm mb-4 leading-relaxed">
          <div className="space-y-1">
             <p>廠區: <span className="font-medium">{user.workstation === 'Y1' ? 'Y1 (Yard 1)' : user.workstation}</span></p>
             <p>工作站: <span className="font-medium">{user.workstation} 組裝站</span></p>
             <p>構件名稱: <span className="font-medium">{selectedMasterItem.itemName}</span></p>
             <p>獎金總額: <span className="font-bold text-lg">${totalAwardValue.toLocaleString()}</span></p>
             <p className="text-xs text-gray-500">
               (銲工:${selectedMasterItem.welderPrice.toLocaleString()} / 領班:${selectedMasterItem.foremanPrice.toLocaleString()})
             </p>
          </div>
          <div className="space-y-1 text-right">
             <p>專案: <span className="font-medium">CWP08 混妙離岸風場</span></p>
             <p>流水號: <span className="font-medium">{serialNo}</span></p>
             <p>申請日期: <span className="font-medium">{submitDate}</span></p>
             <p>單號: <span className="font-bold">{sheetNo || 'Pending...'}</span></p>
             <p>構件編號: <span className="font-bold">{componentSerial || '---'}</span></p>
          </div>
        </div>

        {/* Main Table */}
        <div className="mb-6">
          <table className="w-full border-collapse border border-black text-sm text-center">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black py-2 px-1 w-1/4">施工圖號</th>
                <th className="border border-black py-2 px-1 w-20">#</th>
                <th className="border border-black py-2 px-1 w-20">銲道編號</th>
                <th className="border border-black py-2 px-1">熔填量 (est)</th>
                <th className="border border-black py-2 px-1">分配人員</th>
                <th className="border border-black py-2 px-1">UT 完成時間</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, idx) => (
                <tr key={idx}>
                  <td className="border border-black py-2 px-2 text-left text-xs">{item.drawingNo}</td>
                  <td className="border border-black py-2 px-2 text-black font-semibold">{item.itemSerial}</td>
                  <td className="border border-black py-2 px-2">{item.weldNo}</td>
                  <td className="border border-black py-2 px-2">{item.weight} g</td>
                  <td className="border border-black py-2 px-2 text-xs">
                     {idx === 0 ? allocations.map(a => a.workerName).join(', ') : '同上'}
                  </td>
                  <td className="border border-black py-2 px-2">{item.utDate || submitDate}</td>
                </tr>
              ))}
              {/* Filler rows */}
              {[...Array(Math.max(0, 8 - lineItems.length))].map((_, i) => (
                 <tr key={`fill-${i}`} className="h-8">
                   <td className="border border-black"></td>
                   <td className="border border-black"></td>
                   <td className="border border-black"></td>
                   <td className="border border-black"></td>
                   <td className="border border-black"></td>
                   <td className="border border-black"></td>
                 </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Allocation Table */}
        <div className="mb-8">
           <div className="flex justify-between items-center border border-black border-b-0 px-2 py-1 bg-gray-100 font-bold text-sm">
              <span>銲工每人獎金分配 (焊工編號/金額)</span>
              <span>共 {allocations.length} 人</span>
           </div>
           <table className="w-full border-collapse border border-black text-sm">
             <tbody>
               {allocations.map((alloc, idx) => (
                 <tr key={idx}>
                   <td className="border border-black py-2 px-4 w-1/2">{alloc.workerName || 'N/A'} ({alloc.role === 'WELDER' ? '銲工' : '領班'})</td>
                   <td className="border border-black py-2 px-4 w-1/2 text-right">${alloc.amount.toLocaleString()}</td>
                 </tr>
               ))}
               {[...Array(Math.max(0, 4 - allocations.length))].map((_, i) => (
                  <tr key={`fill-alloc-${i}`}>
                    <td className="border border-black py-4"></td>
                    <td className="border border-black py-4"></td>
                  </tr>
               ))}
             </tbody>
           </table>
        </div>

        {/* Footer */}
        <div className="grid grid-cols-5 border border-black text-xs text-center">
           <div className="border-r border-black"><div className="bg-gray-100 py-1 border-b border-black">廠長</div><div className="h-24"></div></div>
           <div className="border-r border-black"><div className="bg-gray-100 py-1 border-b border-black">銲接主管</div><div className="h-24"></div></div>
           <div className="border-r border-black"><div className="bg-gray-100 py-1 border-b border-black">電焊協調室</div><div className="h-24"></div></div>
           <div className="border-r border-black"><div className="bg-gray-100 py-1 border-b border-black">品管部</div><div className="h-24"></div></div>
           <div><div className="bg-gray-100 py-1 border-b border-black">製表人</div><div className="h-24 pt-16">{user.name}</div></div>
        </div>
      </div>
    );
  };

  return (
    <>
      <PrintLayout />
      <div className="space-y-6 print:hidden">
        {/* Top Header & Actions */}
        <div className="flex items-center justify-between">
           <h1 className="text-2xl font-bold text-gray-800">{editId ? '編輯申請單' : '新增獎金申請單'}</h1>
           <div className="flex gap-3">
             {(sheetNo || editId) && (
               <button 
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
               >
                 <Printer className="h-4 w-4 mr-2" /> 列印表單
               </button>
             )}
           </div>
        </div>

        {/* Top Full-Width Info Card */}
        <div className="bg-brand-50 rounded-xl shadow-md p-6 border border-brand-100">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-2 space-y-4">
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-2">1. 選擇構件類別</label>
                   <select
                      required
                      disabled={!!editId} // Only disable in edit mode
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-brand-500 focus:border-brand-500 bg-white text-gray-900"
                      value={selectedMasterItemId}
                      onChange={e => handleMasterItemChange(e.target.value)}
                    >
                      <option value="">-- 請選擇項目 --</option>
                      {['Mating', 'TP', 'JK'].map(category => (
                        <optgroup key={category} label={category}>
                           {(groupedItems[category] || []).map(item => (
                              <option key={item.id} value={item.id}>
                                 {item.itemName}
                              </option>
                           ))}
                        </optgroup>
                      ))}
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">構件流水號</label>
                    <input
                       type="text"
                       placeholder="例如: #005"
                       className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-brand-500 focus:border-brand-500 bg-white text-gray-900"
                       value={componentSerial}
                       onChange={e => setComponentSerial(e.target.value)}
                    />
                 </div>
              </div>
              
              {/* Spacer Column */}
              <div className="hidden md:block"></div>

              <div className="bg-white rounded p-3 border border-brand-200">
                 <div className="text-sm text-gray-500">獎金總額</div>
                 <div className="text-2xl font-bold text-brand-600">${totalAwardValue.toLocaleString()}</div>
                 {selectedMasterItem && (
                    <div className="text-xs text-gray-600 mt-1 border-t border-gray-100 pt-1">
                       <div className="flex justify-between">
                         <span>銲工:</span> <span className="font-semibold">${selectedMasterItem.welderPrice.toLocaleString()}</span>
                       </div>
                       <div className="flex justify-between">
                         <span>領班:</span> <span className="font-semibold">${selectedMasterItem.foremanPrice.toLocaleString()}</span>
                       </div>
                    </div>
                 )}
                 <div className={`text-xs mt-2 pt-2 border-t font-medium ${isOverBudget ? 'text-red-500' : 'text-green-600'}`}>
                    剩餘預算: ${remainingBudget.toLocaleString()}
                 </div>
              </div>
           </div>
           <div className="mt-4 flex gap-4 text-xs text-gray-500">
               <div className="flex items-center bg-white border border-gray-200 rounded px-3 py-1">
                  <Lock className="h-3 w-3 mr-2" />
                  表單編號: {sheetNo || '自動產生 (YYAATT##)'}
               </div>
               <div className="flex items-center bg-white border border-gray-200 rounded px-3 py-1">
                  日期: {submitDate}
               </div>
           </div>
        </div>

        {/* Weld Line Items & Allocation Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Line Items & Allocation */}
          <div className="lg:col-span-2 space-y-6">
             
             {/* 2. Weld Line Items Section */}
             <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center">
                     <FileText className="h-5 w-5 mr-2 text-brand-500"/> 
                     2. 表單內銲道 (自動帶入)
                  </h3>
                  
                  {selectedMasterItem && availableConfigs.length > 1 && (
                     <div className="w-full md:w-auto flex flex-col gap-1 p-3 bg-yellow-50 border-2 border-yellow-400 rounded-lg shadow-sm">
                        <label className="text-xs font-black text-yellow-800 uppercase tracking-widest">
                           選擇配置 / 圖號
                        </label>
                        <select
                           className="block w-full text-lg font-bold border-2 border-gray-400 rounded-md bg-white text-gray-900 py-2 pl-3 pr-10 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 shadow-inner cursor-pointer"
                           value={selectedConfig}
                           onChange={e => handleConfigChange(e.target.value)}
                        >
                           {availableConfigs.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                     </div>
                  )}
                  {selectedMasterItem && availableConfigs.length <= 1 && (
                     <span className="text-sm bg-gray-100 px-3 py-1.5 rounded-full text-gray-600 font-medium border border-gray-200">
                        {selectedConfig || '標準配置'}
                     </span>
                  )}
                </div>

                {/* List Table */}
                <div className="overflow-x-auto border rounded-lg">
                   <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                         <tr>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/3">圖號</th>
                            <th className="px-3 py-3 text-left text-sm font-black text-black uppercase w-28 border-b-2 border-gray-300 tracking-wider">流水號</th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">銲道</th>
                            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">重量</th>
                            <th className="px-3 py-3 w-10"></th>
                         </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                         {lineItems.length === 0 && (
                            <tr><td colSpan={5} className="px-3 py-8 text-center text-sm text-gray-500">
                               {selectedMasterItem ? '此配置無銲道資料。' : '請先選擇項目以載入銲道。'}
                            </td></tr>
                         )}
                         {lineItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                               <td className="px-3 py-2 text-sm text-gray-900 break-all">{item.drawingNo}</td>
                               <td className="px-3 py-2 bg-gray-50">
                                  <input 
                                    type="text" 
                                    value={item.itemSerial || ''} 
                                    onChange={(e) => handleLineItemSerialChange(idx, e.target.value)}
                                    className="w-full text-base font-bold text-black border-2 border-black rounded px-2 py-1 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white shadow-sm"
                                    placeholder="#"
                                  />
                               </td>
                               <td className="px-3 py-2 text-sm text-gray-900 font-medium">{item.weldNo}</td>
                               <td className="px-3 py-2 text-sm text-gray-500 text-right">{item.weight} g</td>
                               <td className="px-3 py-2 text-right">
                                  <button onClick={() => handleRemoveLineItem(idx)} className="text-gray-400 hover:text-red-500" title="移除">
                                     <Trash2 className="h-4 w-4" />
                                  </button>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
                {lineItems.length > 0 && (
                   <p className="text-xs text-gray-400 mt-2 text-right">
                      * 流水號預設與「構件流水號」相同。如有需要可個別編輯。
                   </p>
                )}
             </div>

             {/* 3. Allocations */}
             <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
                  <h3 className="text-lg font-bold text-gray-900">3. 人員獎金分配</h3>
                  <div className="flex gap-2">
                     <button
                       type="button"
                       onClick={handleDistribute}
                       className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                       title="自動計算各職位平均金額"
                     >
                       <HandCoins className="h-4 w-4 mr-1" /> 平均分配
                     </button>
                     <button
                       type="button"
                       onClick={handleAddWorker}
                       className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full text-brand-700 bg-brand-100 hover:bg-brand-200"
                     >
                       <Plus className="h-4 w-4 mr-1" /> 新增人員
                     </button>
                  </div>
                </div>
                
                {allocations.length === 0 && selectedMasterItem && (
                   <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-md text-sm mb-3">
                      <RefreshCw className="h-4 w-4 animate-spin-slow" />
                      載入預設人員配置...
                   </div>
                )}

                <div className="space-y-3">
                  {allocations.map((alloc, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row gap-3 items-end sm:items-center bg-gray-50 p-3 rounded-md">
                      <div className="flex-1 w-full">
                        <label className="block text-xs text-gray-500 mb-1">職位</label>
                        <select
                          className="block w-full border-gray-300 rounded-md text-sm bg-white text-gray-900"
                          value={alloc.role}
                          onChange={e => updateAllocation(idx, 'role', e.target.value)}
                        >
                          <option value="WELDER">銲工</option>
                          <option value="FOREMAN">領班</option>
                        </select>
                      </div>
                      <div className="flex-[2] w-full">
                         <label className="block text-xs text-gray-500 mb-1">姓名/工號</label>
                         <input
                           type="text"
                           placeholder="姓名"
                           className="block w-full border-gray-300 rounded-md text-sm bg-white text-gray-900"
                           value={alloc.workerName}
                           onChange={e => updateAllocation(idx, 'workerName', e.target.value)}
                           required
                         />
                      </div>
                      <div className="flex-[1] w-full">
                        <label className="block text-xs text-gray-500 mb-1">金額 ($)</label>
                        <input
                           type="number"
                           className="block w-full border-gray-300 rounded-md text-sm bg-white text-gray-900"
                           value={alloc.amount}
                           onChange={e => updateAllocation(idx, 'amount', e.target.value)}
                           min="0"
                           required
                         />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveWorker(idx)}
                        className="p-2 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
             </div>

             {/* Feedback & Actions */}
             <div className="space-y-4">
                {feedback && (
                  <div className={`p-4 rounded-md ${feedback.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    <div className="flex">
                      <div className="flex-shrink-0">
                        {feedback.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium">{feedback.msg}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || isOverBudget || lineItems.length === 0}
                    className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="h-5 w-5 mr-2" />
                    {submitting ? '提交中...' : '提交申請'}
                  </button>
                </div>
             </div>

          </div>

          {/* Right Column: Calculator/Status */}
          <div className="lg:col-span-1 space-y-6">
            <div className={`bg-white rounded-xl shadow-md p-6 border-l-4 ${isOverBudget ? 'border-red-500' : 'border-green-500'}`}>
               <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Calculator className="h-5 w-5 mr-2 text-gray-500" /> 摘要
               </h3>
               <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                     <span className="text-gray-600">獎金總額:</span>
                     <span className="font-medium">${totalAwardValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                     <span className="text-gray-600">已分配總額:</span>
                     <span className="font-medium text-red-600">-${totalAllocated.toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between items-center text-lg font-bold">
                     <span className="text-gray-700">剩餘:</span>
                     <span className={remainingBudget < 0 ? 'text-red-600' : 'text-green-600'}>
                        ${remainingBudget.toLocaleString()}
                     </span>
                  </div>
                  
                  {selectedMasterItem && (
                     <div className="mt-4 pt-4 border-t border-dashed border-gray-300">
                        <p className="text-xs text-gray-500 mb-2">明細 (參考):</p>
                        
                        {/* Welder Check */}
                        <div className="flex justify-between text-xs mb-1">
                           <span>銲工總額:</span>
                           <span className={isWelderOver ? 'text-red-600 font-bold' : 'text-green-600'}>
                             ${welderAllocated.toLocaleString()} / ${selectedMasterItem.welderPrice.toLocaleString()}
                           </span>
                        </div>
                        {isWelderOver && <div className="text-[10px] text-red-500 text-right">超過上限</div>}

                        {/* Foreman Check */}
                        <div className="flex justify-between text-xs">
                           <span>領班總額:</span>
                           <span className={isForemanOver ? 'text-red-600 font-bold' : 'text-green-600'}>
                              ${foremanAllocated.toLocaleString()} / ${selectedMasterItem.foremanPrice.toLocaleString()}
                           </span>
                        </div>
                        {isForemanOver && <div className="text-[10px] text-red-500 text-right">超過上限</div>}
                     </div>
                  )}

                  {isOverBudget && <p className="text-red-600 text-xs font-bold mt-2 bg-red-50 p-2 rounded">錯誤：超過預算上限。請調整金額。</p>}
                  
               </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
               <h3 className="text-lg font-medium text-gray-900 mb-4"><Info className="h-5 w-5 inline mr-2"/> 說明</h3>
               <ul className="text-sm text-gray-500 space-y-2 list-disc list-inside">
                  <li>請先選擇 <strong>構件類別</strong>。</li>
                  <li>輸入 <strong>構件流水號</strong> (例如: #005)。</li>
                  <li>確認 <strong>圖號</strong>。</li>
                  <li>檢查表格中 <strong>自動帶入的銲道</strong>。</li>
                  <li>使用 <strong>平均分配</strong> 按鈕自動計算金額。</li>
               </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ApplicationForm;