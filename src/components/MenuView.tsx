import React, { useState } from "react";
import { MenuItem, ServiceCategory } from "../types";
import { formatZAR } from "../utils/formatters";
import {
  Plus,
  Search,
  Sparkles,
  Clock,
  Trash2,
  Edit2,
  RotateCcw,
  CheckCircle2,
  Check,
  X,
  Tag
} from "lucide-react";

interface MenuViewProps {
  menu: MenuItem[];
  onAddService: (service: MenuItem) => void;
  onUpdateService: (service: MenuItem) => void;
  onDeleteService: (id: string) => void;
  onResetMenu: () => void;
}

const CATEGORIES: ServiceCategory[] = [
  "Acrylic Extensions",
  "BIAB & Gel Overlays",
  "Nail Art & Add-ons",
  "Pedicures & Spa",
  "Maintenance & Soak-off",
];

export const MenuView: React.FC<MenuViewProps> = ({
  menu,
  onAddService,
  onUpdateService,
  onDeleteService,
  onResetMenu,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<ServiceCategory>("Acrylic Extensions");
  const [formPrice, setFormPrice] = useState<number | string>(350);
  const [formDuration, setFormDuration] = useState<number | string>(60);
  const [formDescription, setFormDescription] = useState("");
  const [formIsPopular, setFormIsPopular] = useState(false);

  const openAddModal = () => {
    setFormName("");
    setFormCategory("Acrylic Extensions");
    setFormPrice(380);
    setFormDuration(90);
    setFormDescription("");
    setFormIsPopular(false);
    setIsAdding(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormPrice(item.price);
    setFormDuration(item.durationMinutes);
    setFormDescription(item.description);
    setFormIsPopular(!!item.isPopular);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const numericPrice = Number(formPrice) || 0;
    const numericDuration = Number(formDuration) || 30;

    if (editingItem) {
      onUpdateService({
        ...editingItem,
        name: formName.trim(),
        category: formCategory,
        price: numericPrice,
        durationMinutes: numericDuration,
        description: formDescription.trim(),
        isPopular: formIsPopular,
      });
      setEditingItem(null);
    } else {
      const newItem: MenuItem = {
        id: `srv-${Date.now()}`,
        name: formName.trim(),
        category: formCategory,
        price: numericPrice,
        durationMinutes: numericDuration,
        description: formDescription.trim(),
        isPopular: formIsPopular,
        isActive: true,
      };
      onAddService(newItem);
      setIsAdding(false);
    }
  };

  const filteredMenu = menu.filter((item) => {
    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const popularCount = menu.filter((i) => i.isPopular && i.isActive).length;
  const avgPrice = menu.length
    ? Math.round(menu.reduce((acc, curr) => acc + curr.price, 0) / menu.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header with Title & Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-stone-900">Nail Services & Price Menu</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              South African Rand (ZAR)
            </span>
          </div>
          <p className="text-sm text-stone-500 mt-1">
            Edit your treatment menu, update ZAR pricing, set service duration, and toggle client visibility.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
            title="Reset to default authentic South African nail menu"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Service</span>
          </button>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-stone-200/80 shadow-xs">
          <div className="text-xs font-medium text-stone-500">Active Services</div>
          <div className="text-xl font-bold text-stone-900 mt-1">{menu.filter((m) => m.isActive).length} items</div>
          <div className="text-[11px] text-stone-400 mt-0.5">Across 5 categories</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-white border border-stone-200/80 shadow-xs">
          <div className="text-xs font-medium text-stone-500">Average Treatment Price</div>
          <div className="text-xl font-bold text-stone-900 mt-1">{formatZAR(avgPrice)}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Competitive SA salon rates</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-white border border-stone-200/80 shadow-xs col-span-2 sm:col-span-1">
          <div className="text-xs font-medium text-stone-500">Trending / Top Picks</div>
          <div className="text-xl font-bold text-stone-900 mt-1">{popularCount} featured</div>
          <div className="text-[11px] text-stone-400 mt-0.5">High booking frequency</div>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search acrylic, BIAB, pedicure, chrome, fill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-stone-200 bg-white placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
            />
          </div>

          <div className="text-xs text-stone-500 font-medium self-center px-1">
            Showing {filteredMenu.length} of {menu.length} services
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory("All")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
              selectedCategory === "All"
                ? "bg-stone-900 text-white shadow-xs"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            All Services ({menu.length})
          </button>
          {CATEGORIES.map((category) => {
            const count = menu.filter((i) => i.category === category).length;
            const isSelected = selectedCategory === category;
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-stone-900 text-white shadow-xs"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {category} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredMenu.map((item) => (
          <div
            key={item.id}
            className={`group rounded-2xl bg-white border transition-all p-5 flex flex-col justify-between ${
              item.isActive
                ? "border-stone-200 shadow-xs hover:border-stone-300 hover:shadow-sm"
                : "border-stone-200/60 bg-stone-50/50 opacity-70"
            }`}
          >
            <div>
              {/* Card Header: Category & Badges */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-semibold tracking-wide uppercase px-2.5 py-0.5 rounded-md bg-stone-100 text-stone-600">
                  {item.category}
                </span>

                <div className="flex items-center gap-1.5">
                  {item.isPopular && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200/60">
                      <Sparkles className="w-3 h-3" />
                      Popular
                    </span>
                  )}
                  {!item.isActive && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-stone-200 text-stone-600">
                      Disabled
                    </span>
                  )}
                </div>
              </div>

              {/* Title & Description */}
              <h3 className="font-semibold text-stone-900 text-base leading-snug">
                {item.name}
              </h3>
              <p className="text-xs text-stone-500 mt-1.5 line-clamp-2 leading-relaxed">
                {item.description || "No description provided."}
              </p>
            </div>

            {/* Bottom Row: Price in ZAR, Duration, and Actions */}
            <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-stone-900 tracking-tight">
                  {formatZAR(item.price)}
                </div>
                <div className="flex items-center gap-1 text-xs text-stone-400 font-medium">
                  <Clock className="w-3 h-3" />
                  <span>{item.durationMinutes} mins</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() =>
                    onUpdateService({ ...item, isActive: !item.isActive })
                  }
                  title={item.isActive ? "Hide from clients" : "Make active"}
                  className={`p-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    item.isActive
                      ? "border-stone-200 text-stone-600 hover:bg-stone-100"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {item.isActive ? "Active" : "Enable"}
                </button>

                <button
                  onClick={() => openEditModal(item)}
                  className="p-2 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-100 transition-colors"
                  title="Edit item & price"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onDeleteService(item.id)}
                  className="p-2 rounded-lg border border-stone-200 text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Delete service"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredMenu.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-stone-200">
          <Tag className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <h3 className="font-semibold text-stone-800 text-sm">No services found</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or category filter, or add a custom service to your menu.
          </p>
          <button
            onClick={openAddModal}
            className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-stone-900 rounded-xl"
          >
            <Plus className="w-3.5 h-3.5" />
            Add New Service
          </button>
        </div>
      )}

      {/* Add / Edit Modal */}
      {(isAdding || editingItem) && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="relative bg-white rounded-2xl max-w-lg w-full my-auto shadow-2xl border border-stone-200 flex flex-col max-h-[92vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-white shrink-0">
              <div>
                <h2 className="text-lg font-bold text-stone-900">
                  {editingItem ? "Edit Service & ZAR Price" : "Add New Nail Service"}
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">Customize service pricing and duration</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingItem(null);
                }}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto p-5 sm:p-6 space-y-4 flex-1">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Service Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sculptured Ombré Acrylic Full Set"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-stone-900/10"
                  />
                </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) =>
                      setFormCategory(e.target.value as ServiceCategory)
                    }
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-stone-900/10"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Price in SA Rands (ZAR) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-500">
                      R
                    </span>
                    <input
                      type="number"
                      required
                      min={0}
                      step={5}
                      placeholder="380"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      className="w-full pl-8 pr-3.5 py-2 text-sm font-semibold rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-stone-900/10"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Treatment Duration (Minutes) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={5}
                      step={5}
                      placeholder="90"
                      value={formDuration}
                      onChange={(e) => setFormDuration(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-stone-900/10"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-medium">
                      mins
                    </span>
                  </div>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsPopular}
                      onChange={(e) => setFormIsPopular(e.target.checked)}
                      className="w-4 h-4 rounded text-stone-900 border-stone-300 focus:ring-stone-900"
                    />
                    <span className="text-xs font-medium text-stone-700">
                      Mark as "Popular / Best Seller"
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Description / Nail Details
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain what's included, e.g. dry cuticle prep, apex balance, high-shine top coat."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-stone-900/10"
                />
                </div>
              </div>

              {/* Sticky Modal Footer */}
              <div className="px-6 py-3.5 border-t border-stone-100 bg-stone-50/90 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-200/60 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl shadow-xs transition-colors"
                >
                  {editingItem ? "Save Changes" : "Add to Menu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-stone-200">
            <h3 className="font-bold text-stone-900 text-base">Reset Menu to Defaults?</h3>
            <p className="text-xs text-stone-600 mt-2 leading-relaxed">
              This will reload the full South African salon menu with standard ZAR prices for Acrylics, BIAB, Gel, Pedicures, and Nail Art. Any custom items you added will be replaced.
            </p>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3.5 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onResetMenu();
                  setShowResetConfirm(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl"
              >
                Reset Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
