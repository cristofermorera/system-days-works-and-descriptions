import React, { useState, useMemo } from 'react';
import type { IconItem } from '../types';
import { IconRenderer } from './IconRenderer';
import { X, Search, Check, CheckSquare, Square, AlertCircle } from 'lucide-react';
import { MONTH_NAMES } from '../utils/dateUtils';

interface DayIconsModalProps {
  dateKey: string;
  currentIcons: IconItem[];
  availableIcons: IconItem[];
  onSave: (dateKey: string, iconIds: string[]) => Promise<void>;
  onClose: () => void;
  canEdit?: boolean;
}

export const DayIconsModal: React.FC<DayIconsModalProps> = ({
  dateKey,
  currentIcons,
  availableIcons,
  onSave,
  onClose,
  canEdit = true,
}) => {
  // Ordered array of selected icons (max 6)
  const [selectedIcons, setSelectedIcons] = useState<IconItem[]>(() => [...currentIcons]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Date parsing for header
  const [yearStr, monthStr, dayStr] = dateKey.split('-');
  const dayNumber = parseInt(dayStr, 10);
  const monthIndex = parseInt(monthStr, 10) - 1;
  const monthName = MONTH_NAMES[monthIndex] || '';

  // Selected icon IDs set for fast check
  const selectedIds = useMemo(() => {
    return new Set(selectedIcons.map((i) => i.id));
  }, [selectedIcons]);

  // Filtered available icons based on search query
  const filteredIcons = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return availableIcons;
    return availableIcons.filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        (item.description && item.description.toLowerCase().includes(term)) ||
        item.icon.toLowerCase().includes(term)
    );
  }, [availableIcons, searchTerm]);

  // Toggle selection of an icon
  const handleToggleIcon = (iconItem: IconItem) => {
    if (!canEdit) return;
    setNotice(null);

    const isAlreadySelected = selectedIds.has(iconItem.id);

    if (isAlreadySelected) {
      // Remove
      setSelectedIcons((prev) => prev.filter((i) => i.id !== iconItem.id));
    } else {
      // Add (enforce max 6 for the day)
      if (selectedIcons.length >= 6) {
        setNotice('Limite de 6 ícones por dia atingido. Remova um ícone para adicionar outro.');
        return;
      }
      setSelectedIcons((prev) => [...prev, iconItem]);
    }
  };

  // Remove individual icon from top preview chips
  const handleRemoveIcon = (iconId: string) => {
    if (!canEdit) return;
    setNotice(null);
    setSelectedIcons((prev) => prev.filter((i) => i.id !== iconId));
  };

  // Clear all selections for the day
  const handleClearAll = () => {
    if (!canEdit) return;
    setNotice(null);
    setSelectedIcons([]);
  };

  // Save handler
  const handleSave = async () => {
    if (!canEdit) return;
    setIsSaving(true);
    setNotice(null);
    try {
      const iconIds = selectedIcons.map((i) => i.id);
      await onSave(dateKey, iconIds);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar marcações.';
      setNotice(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const count = selectedIcons.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-stone-100 shrink-0">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-500">
              Marcações do Dia
            </span>
            <h2 id="modal-title" className="text-lg sm:text-xl font-bold text-stone-900 leading-tight">
              Adicionar ícones ao dia {dayNumber}{' '}
              <span className="text-sm font-semibold text-stone-500">
                de {monthName}
              </span>
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected count banner & chips */}
        <div className="py-3 border-b border-stone-100 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-800">
                Selecionados: <span className="text-emerald-700 font-bold">{count}/6</span>
              </span>
              {/* Visual 6 dots indicator */}
              <div className="flex items-center gap-1">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <span
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      idx < count ? 'bg-emerald-600' : 'bg-stone-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            {count > 0 && canEdit && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[11px] text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
              >
                Limpar dia
              </button>
            )}
          </div>

          {/* Chips of currently selected icons */}
          {count > 0 ? (
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
              {selectedIcons.map((item) => (
                <span
                  key={item.id}
                  className="inline-flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-950 shadow-2xs"
                >
                  <IconRenderer icon={item.icon} size="xs" />
                  <span className="truncate max-w-[110px]">{item.name}</span>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => handleRemoveIcon(item.id)}
                      className="p-0.5 hover:bg-emerald-200/60 rounded text-emerald-700 hover:text-emerald-950 cursor-pointer"
                      title={`Remover ${item.name}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-[11px] text-stone-600 italic">
              Nenhum ícone selecionado. Escolha até 6 ícones da biblioteca abaixo.
            </div>
          )}
        </div>

        {/* Notice alert */}
        {notice && (
          <div className="my-2 p-2.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 shrink-0 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {/* Search Input */}
        <div className="pt-3 pb-2 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔎 Pesquisar ícone por nome ou descrição..."
              className="w-full pl-9 pr-8 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="p-1 text-stone-400 hover:text-stone-600 absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Icon Library Selection List */}
        <div className="flex-1 overflow-y-auto divide-y divide-stone-100 pr-1">
          {filteredIcons.length === 0 ? (
            <div className="py-8 text-center text-xs text-stone-400">
              Nenhum ícone encontrado para "{searchTerm}".
            </div>
          ) : (
            filteredIcons.map((item) => {
              const isSelected = selectedIds.has(item.id);
              const isLimitReached = !isSelected && count >= 6;

              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={!canEdit || isLimitReached}
                  onClick={() => handleToggleIcon(item)}
                  className={`
                    w-full flex items-center justify-between py-2.5 px-2 rounded-xl text-left transition-colors cursor-pointer
                    ${
                      isSelected
                        ? 'bg-emerald-50/70 hover:bg-emerald-50 text-emerald-950 font-medium'
                        : isLimitReached
                          ? 'opacity-40 hover:bg-transparent cursor-not-allowed text-stone-400'
                          : 'hover:bg-stone-50 text-stone-800'
                    }
                  `}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Checkbox representation */}
                    <div className="shrink-0 text-stone-400">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                      ) : (
                        <Square className="w-4 h-4 text-stone-300" />
                      )}
                    </div>

                    {/* Icon glyph */}
                    <div className="w-7 h-7 rounded-lg bg-white border border-stone-200/80 shadow-2xs flex items-center justify-center shrink-0">
                      <IconRenderer icon={item.icon} size="sm" />
                    </div>

                    {/* Name & description */}
                    <div className="min-w-0 truncate">
                      <div className="text-xs font-semibold truncate">
                        {item.name}
                      </div>
                      {item.description && (
                        <div className="text-[10px] text-stone-600 truncate">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status tag */}
                  <div className="shrink-0 pl-2">
                    {isSelected && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                        Selecionado
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-3.5 border-t border-stone-100 mt-2 shrink-0">
          <div className="text-xs font-semibold text-stone-500">
            {count === 0
              ? 'Dia sem ícones'
              : count === 1
                ? '1 ícone selecionado'
                : `${count} de 6 ícones`}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            {canEdit && (
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSave}
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                {isSaving ? (
                  <span>Salvando...</span>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Salvar</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
