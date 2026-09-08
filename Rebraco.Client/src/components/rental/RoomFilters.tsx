import { GENDERS } from '../../types/rental';

export interface RoomFilterState {
  gender: string;
  semesters: string[];
  minPrice: string;
  maxPrice: string;
  bedrooms: string;
  furnished: string;
  availableBefore: string;
  leaseTerm: string;
  sort: string;
}

export const DEFAULT_ROOM_FILTERS: RoomFilterState = {
  gender: '',
  semesters: [],
  minPrice: '',
  maxPrice: '',
  bedrooms: '',
  furnished: '',
  availableBefore: '',
  leaseTerm: '',
  sort: 'price-asc',
};

const SEMESTER_OPTIONS = [
  { value: 'fall', label: 'Fall' },
  { value: 'winter', label: 'Winter' },
  { value: 'spring', label: 'Spring' },
];

const BEDROOM_OPTIONS = [
  { value: '1', label: '1 Bed' },
  { value: '2', label: '2 Beds' },
  { value: '3', label: '3 Beds' },
  { value: '4+', label: '4+ Beds' },
];

const FURNISHED_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'yes', label: 'Furnished' },
  { value: 'no', label: 'Unfurnished' },
];

const LEASE_OPTIONS = [
  { value: '', label: 'Any Term' },
  { value: 'semester', label: 'Semester' },
  { value: '6-month', label: '6 Month' },
  { value: '12-month', label: '12 Month' },
];

const SORT_OPTIONS = [
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'beds-asc', label: 'Beds: Fewest First' },
  { value: 'beds-desc', label: 'Beds: Most First' },
  { value: 'available', label: 'Available Soonest' },
];

interface RoomFiltersProps {
  filters: RoomFilterState;
  onChange: (filters: RoomFilterState) => void;
  totalCount: number;
  filteredCount: number;
  label?: string;
}

export default function RoomFilters({ filters, onChange, totalCount, filteredCount, label = 'Rooms' }: RoomFiltersProps) {
  const update = (partial: Partial<RoomFilterState>) => {
    onChange({ ...filters, ...partial });
  };

  const toggleSemester = (semester: string) => {
    const next = filters.semesters.includes(semester)
      ? filters.semesters.filter((s) => s !== semester)
      : [...filters.semesters, semester];
    update({ semesters: next });
  };

  const hasFilters =
    filters.gender !== '' ||
    filters.semesters.length > 0 ||
    filters.minPrice !== '' ||
    filters.maxPrice !== '' ||
    filters.bedrooms !== '' ||
    filters.furnished !== '' ||
    filters.availableBefore !== '' ||
    filters.leaseTerm !== '';

  const selectClass =
    'px-3 py-2 border border-border rounded-lg bg-bg text-text text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none';
  const inputClass = selectClass;

  return (
    <div className="space-y-4 mb-6">
      {/* Row 1: Gender, Semesters, Bedrooms */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Gender */}
        <select
          value={filters.gender}
          onChange={(e) => update({ gender: e.target.value })}
          className={selectClass}
        >
          <option value="">Any Gender</option>
          {GENDERS.map((g) => (
            <option key={g.value} value={g.value}>{g.label}</option>
          ))}
        </select>

        {/* Semesters */}
        <div className="flex items-center gap-1.5">
          {SEMESTER_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => toggleSemester(s.value)}
              className={`px-3 py-2 text-sm rounded-lg border transition ${
                filters.semesters.includes(s.value)
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'border-border bg-bg text-text-muted hover:border-primary/50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Bedrooms */}
        <select
          value={filters.bedrooms}
          onChange={(e) => update({ bedrooms: e.target.value })}
          className={selectClass}
        >
          <option value="">Any Beds</option>
          {BEDROOM_OPTIONS.map((b) => (
            <option key={b.value} value={b.value}>{b.label}</option>
          ))}
        </select>

        {/* Furnished */}
        <select
          value={filters.furnished}
          onChange={(e) => update({ furnished: e.target.value })}
          className={selectClass}
        >
          {FURNISHED_OPTIONS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      {/* Row 2: Price, Available, Lease, Sort */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Price range */}
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            placeholder="Min $"
            value={filters.minPrice}
            onChange={(e) => update({ minPrice: e.target.value })}
            className={`${inputClass} w-24`}
            min="0"
          />
          <span className="text-text-muted text-sm">–</span>
          <input
            type="number"
            placeholder="Max $"
            value={filters.maxPrice}
            onChange={(e) => update({ maxPrice: e.target.value })}
            className={`${inputClass} w-24`}
            min="0"
          />
        </div>

        {/* Available before */}
        <input
          type="date"
          value={filters.availableBefore}
          onChange={(e) => update({ availableBefore: e.target.value })}
          className={`${inputClass} ${filters.availableBefore ? '' : 'text-text-muted'}`}
          title="Available before"
        />

        {/* Lease term */}
        <select
          value={filters.leaseTerm}
          onChange={(e) => update({ leaseTerm: e.target.value })}
          className={selectClass}
        >
          {LEASE_OPTIONS.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={filters.sort}
          onChange={(e) => update({ sort: e.target.value })}
          className={selectClass}
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        {/* Clear */}
        {hasFilters && (
          <button
            onClick={() => onChange(DEFAULT_ROOM_FILTERS)}
            className="px-3 py-2 text-sm text-primary hover:text-primary/80 transition"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Results count */}
      <p className="text-sm text-text-muted">
        Showing {filteredCount} of {totalCount} {label.toLowerCase()}
      </p>
    </div>
  );
}
