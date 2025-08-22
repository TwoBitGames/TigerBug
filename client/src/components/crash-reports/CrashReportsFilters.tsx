import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import type { CrashReportFilters } from '@/types';

interface CrashReportsFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filters: CrashReportFilters;
  onFilterChange: (key: keyof CrashReportFilters, value: any) => void;
}

export const CrashReportsFilters = ({ 
  searchTerm, 
  onSearchChange, 
  filters, 
  onFilterChange 
}: CrashReportsFiltersProps) => {
  return (
    <Card className="py-0">
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search crashes by error message, stack trace..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Select 
              value={filters.status || 'all'} 
              onValueChange={(value) => onFilterChange('status', value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Reviewing">Reviewing</SelectItem>
                <SelectItem value="Converted">Converted</SelectItem>
                <SelectItem value="Ignored">Ignored</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.sort} onValueChange={(value) => onFilterChange('sort', value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Date</SelectItem>
                <SelectItem value="crash_frequency">Frequency</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.order} onValueChange={(value) => onFilterChange('order', value)}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DESC">Desc</SelectItem>
                <SelectItem value="ASC">Asc</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
