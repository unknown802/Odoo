import { useState } from "react";
import { Search, AlertCircle, Clock, CheckCircle2, ChevronDown, ChevronUp, PackagePlus } from "lucide-react";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { daysOverdue, formatDate } from "../../lib/utils";
import type { Allocation, Asset, Profile } from "../../types";

interface OverdueReturnsTableProps {
  overdueAllocations: Allocation[];
  assets: Asset[];
  profiles: Profile[];
}

type SortField = 'asset' | 'holder' | 'due' | 'risk';
type SortOrder = 'asc' | 'desc';

export function OverdueReturnsTable({ overdueAllocations, assets, profiles }: OverdueReturnsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>('risk');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'risk' ? 'desc' : 'asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronDown className="h-4 w-4 opacity-20" />;
    return sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const enrichedData = overdueAllocations.map(allocation => {
    const asset = assets.find((candidate) => candidate.id === allocation.asset_id);
    const holder = profiles.find((candidate) => candidate.id === allocation.allocated_to_id);
    const overdueDays = daysOverdue(allocation.expected_return_date);
    
    return {
      allocation,
      asset,
      holder,
      overdueDays,
      searchString: `${asset?.name} ${asset?.asset_tag} ${holder?.full_name}`.toLowerCase()
    };
  });

  const filteredData = enrichedData.filter(item => 
    searchTerm === "" || item.searchString.includes(searchTerm.toLowerCase())
  );

  const sortedData = [...filteredData].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'asset') {
      comparison = (a.asset?.name || "").localeCompare(b.asset?.name || "");
    } else if (sortField === 'holder') {
      comparison = (a.holder?.full_name || "").localeCompare(b.holder?.full_name || "");
    } else if (sortField === 'due') {
      comparison = new Date(a.allocation.expected_return_date || 0).getTime() - new Date(b.allocation.expected_return_date || 0).getTime();
    } else if (sortField === 'risk') {
      comparison = a.overdueDays - b.overdueDays;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-slate-800">Overdue Returns</h3>
            {overdueAllocations.length > 0 && (
              <Badge tone="danger" className="animate-pulse">{overdueAllocations.length} Action Required</Badge>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">Assets that have passed their expected return date</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search assets or holders..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none transition-colors focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand"
          />
        </div>
      </div>
      
      <div className="relative overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
            <tr>
              <th scope="col" className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('asset')}>
                <div className="flex items-center gap-1">Asset <SortIcon field="asset" /></div>
              </th>
              <th scope="col" className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('holder')}>
                <div className="flex items-center gap-1">Holder <SortIcon field="holder" /></div>
              </th>
              <th scope="col" className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('due')}>
                <div className="flex items-center gap-1">Due Date <SortIcon field="due" /></div>
              </th>
              <th scope="col" className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('risk')}>
                <div className="flex items-center gap-1">Risk Level <SortIcon field="risk" /></div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedData.map(({ allocation, asset, holder, overdueDays }) => {
              const isHighRisk = overdueDays > 14;
              const isMediumRisk = overdueDays > 7 && overdueDays <= 14;
              
              return (
                <tr key={allocation.id} className="bg-white hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500 group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-slate-200">
                        <PackagePlus className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">{asset?.name}</div>
                        <div className="text-xs font-medium text-slate-500">{asset?.asset_tag}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand-dark">
                        {holder ? getInitials(holder.full_name) : "?"}
                      </div>
                      <div>
                        <div className="font-medium text-slate-700">{holder?.full_name}</div>
                        <div className="text-xs text-slate-500">{holder?.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Clock className="h-4 w-4 text-slate-400" />
                      {formatDate(allocation.expected_return_date)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {isHighRisk ? (
                        <Badge tone="danger" className="gap-1 flex items-center">
                          <AlertCircle className="h-3 w-3" />
                          Critical: {overdueDays} days
                        </Badge>
                      ) : isMediumRisk ? (
                        <Badge tone="warning" className="gap-1 flex items-center">
                          <AlertCircle className="h-3 w-3" />
                          Warning: {overdueDays} days
                        </Badge>
                      ) : (
                        <Badge tone="info" className="gap-1 flex items-center">
                          <AlertCircle className="h-3 w-3" />
                          Late: {overdueDays} days
                        </Badge>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            
            {sortedData.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <CheckCircle2 className="h-12 w-12 text-emerald-400 mb-3" />
                    <p className="text-lg font-medium text-slate-700">All caught up!</p>
                    <p className="text-sm">No overdue returns at this time.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3">
        <div className="text-xs text-slate-500">
          Showing {sortedData.length} of {overdueAllocations.length} records
        </div>
        <div className="flex gap-1">
          <button className="h-8 rounded px-3 text-xs font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50" disabled>Previous</button>
          <button className="h-8 rounded px-3 text-xs font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50" disabled>Next</button>
        </div>
      </div>
    </Card>
  );
}
