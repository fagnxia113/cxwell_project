import React, { useEffect, useState } from 'react'
import { GitBranch, ChevronRight, HelpCircle, CheckCircle2 } from 'lucide-react'
import { taskService } from '../../../services/taskService'

interface PredictedNode {
  nodeCode: string
  nodeName: string
  nodeType: number
  isPrediction: boolean
  choices?: string[]
  approvers?: Array<{
    userId: string
    userName: string
    loginName: string
  }>
}

interface WorkflowPredictorProps {
  instanceId: string
  variables?: any
  t: any
}

export const WorkflowPredictor: React.FC<WorkflowPredictorProps> = ({ instanceId, variables, t }) => {
  const [prediction, setPrediction] = useState<PredictedNode[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        const data = await taskService.predictPath(instanceId, variables)
        setPrediction(data)
      } catch (err) {
        console.error('Failed to fetch prediction:', err)
      } finally {
        setLoading(false)
      }
    }
    if (instanceId) fetchPrediction()
  }, [instanceId, variables])

  if (loading) return (
    <div className="flex items-center gap-3 p-4 animate-pulse">
      <div className="w-8 h-8 bg-gray-100 rounded-lg" />
      <div className="h-4 bg-gray-100 rounded w-48" />
    </div>
  )

  if (prediction.length === 0) return null

  return (
    <div className="p-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
        <GitBranch className="w-4 h-4" />
        {t('workflow.prediction.title') || '未来路径预测'}
      </h4>

      <div className="space-y-4">
        {prediction.map((node, index) => (
          <div key={`${node.nodeCode}-${index}`} className="flex items-center gap-4">
            {/* Connector Line */}
            <div className="flex flex-col items-center">
               <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 border-dashed ${
                 (node.nodeCode === 'GATEWAY' || node.nodeCode === 'GATEWAY_CHOICE') ? 'bg-amber-50 border-amber-200 text-amber-500' : 'bg-white border-slate-200 text-slate-300'
               }`}>
                 {(node.nodeCode === 'GATEWAY' || node.nodeCode === 'GATEWAY_CHOICE') ? <HelpCircle className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
               </div>
            </div>

            <div className="flex-1 p-3 rounded-xl bg-white/50 border border-white shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-bold ${(node.nodeCode === 'GATEWAY' || node.nodeCode === 'GATEWAY_CHOICE') ? 'text-amber-600' : 'text-slate-500'}`}>
                  {node.nodeName}
                </span>
                
                {node.choices && (
                  <div className="flex gap-2">
                    {node.choices.map((choice, idx) => (
                      <span key={`${choice}-${idx}`} className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[10px] font-bold">
                        {choice}
                      </span>
                    ))}
                  </div>
                )}

                {node.nodeType === 2 && (
                  <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase">
                    <CheckCircle2 className="w-3 h-3" />
                    {t('workflow.end') || '结束'}
                  </div>
                )}
              </div>

              {node.approvers && node.approvers.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{t('workflow.prediction.approvers')}:</span>
                  {node.approvers.map((user, uIdx) => (
                    <div key={`${user.userId}-${user.loginName}-${uIdx}`} className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-md border border-blue-100">
                      {user.userName}
                    </div>
                  ))}
                </div>
              )}
              
              {node.approvers && node.approvers.length === 0 && node.nodeType !== 2 && node.nodeCode !== 'GATEWAY' && (
                <div className="text-[10px] text-amber-500 font-bold italic">
                  {t('workflow.prediction.no_approver_skip')}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-2 text-[10px] text-slate-400 italic">
        <HelpCircle className="w-3 h-3" />
        {t('workflow.prediction.hint') || '基于当前业务数据自动演算，实际路径可能因手动决策改变'}
      </div>
    </div>
  )
}
