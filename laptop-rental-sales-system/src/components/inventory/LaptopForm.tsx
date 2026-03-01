import React, { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "../common/Button";

interface LaptopFormData {
  brand: string;
  model: string;
  serial_number: string;
  processor: string;
  generation: string; // ✅ ADDED
  ram: string;
  storage: string;
  price: string;
  rent_per_month: string;
  purchased_from: string;
  status: string;
  description: string;
}

interface LaptopFormProps {
  laptop?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function LaptopForm({ laptop, onSubmit, onCancel }: LaptopFormProps) {
  const [formData, setFormData] = useState<LaptopFormData>({
    brand: laptop?.brand || "",
    model: laptop?.model || "",
    serial_number: laptop?.serial_number || "",
    processor: laptop?.processor || "",
    generation: laptop?.generation || "", // ✅ ADDED
    ram: laptop?.ram || "",
    storage: laptop?.storage || "",
    price: laptop?.price ? String(laptop.price) : "",
    rent_per_month: laptop?.rent_per_month
      ? String(laptop.rent_per_month)
      : "",
    purchased_from: laptop?.purchased_from || "",
    status: laptop?.status || "AVAILABLE",
    description: laptop?.description?.notes || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const required = [
      "brand",
      "model",
      "serial_number",
      "processor",
      "generation", // ✅ REQUIRED
      "ram",
      "storage",
      "price",
      "rent_per_month",
    ];

    const newErrors: Record<string, string> = {};

    required.forEach((field) => {
      if (!formData[field as keyof LaptopFormData]) {
        newErrors[field] = "Required";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    const payload = {
      brand: formData.brand,
      model: formData.model,
      serial_number: formData.serial_number,
      processor: formData.processor,
      generation: formData.generation, // ✅ SENT TO BACKEND
      ram: formData.ram,
      storage: formData.storage,
      price: parseFloat(formData.price),
      rent_per_month: parseFloat(formData.rent_per_month),
      purchased_from: formData.purchased_from,
      status: formData.status,
      description: {
        notes: formData.description,
      },
    };

    try {
      await onSubmit(payload);
    } catch (error: any) {
      console.error(error);
      alert(
        error?.response?.data?.serial_number
          ? "Serial number already exists"
          : "Failed to save laptop"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {Object.keys(errors).length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-800">
            Please fill all required fields
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Brand */}
        <div>
          <label className="block text-sm font-medium mb-2">Brand *</label>
          <select
            name="brand"
            value={formData.brand}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-200 rounded-lg"
          >
            <option value="">Select Brand</option>
            <option>Dell</option>
            <option>HP</option>
            <option>Lenovo</option>
            <option>Apple</option>
            <option>Asus</option>
            <option>Acer</option>
            <option>MSI</option>
          </select>
        </div>

        {/* Model */}
        <div>
          <label className="block text-sm font-medium mb-2">Model *</label>
          <input
            name="model"
            value={formData.model}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-200 rounded-lg"
          />
        </div>

        {/* Serial */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Serial Number *
          </label>
          <input
            name="serial_number"
            value={formData.serial_number}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-200 rounded-lg"
          />
        </div>

        {/* Processor */}
        <div>
          <label className="block text-sm font-medium mb-2">Processor *</label>
          <input
            name="processor"
            value={formData.processor}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-200 rounded-lg"
          />
        </div>

        {/* ✅ Generation */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Generation *
          </label>
          <input
            name="generation"
            value={formData.generation}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-200 rounded-lg"
            placeholder="e.g. 10th Gen / M1 / Ryzen 5 5000"
          />
        </div>

        {/* RAM */}
        <div>
          <label className="block text-sm font-medium mb-2">RAM *</label>
          <select
            name="ram"
            value={formData.ram}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-200 rounded-lg"
          >
            <option value="">Select</option>
            <option>8GB</option>
            <option>16GB</option>
            <option>32GB</option>
          </select>
        </div>

        {/* Storage */}
        <div>
          <label className="block text-sm font-medium mb-2">Storage *</label>
          <select
            name="storage"
            value={formData.storage}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-200 rounded-lg"
          >
            <option value="">Select</option>
            <option>256GB SSD</option>
            <option>512GB SSD</option>
            <option>1TB SSD</option>
          </select>
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium mb-2">Price *</label>
          <input
            type="number"
            step="0.01"
            name="price"
            value={formData.price}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-200 rounded-lg"
          />
        </div>

        {/* Rent */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Rent Per Month *
          </label>
          <input
            type="number"
            step="0.01"
            name="rent_per_month"
            value={formData.rent_per_month}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-200 rounded-lg"
          />
        </div>

        {/* Purchased From */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Purchased From
          </label>
          <input
            name="purchased_from"
            value={formData.purchased_from}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-200 rounded-lg"
            placeholder="Vendor / Supplier Name"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium mb-2">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-neutral-200 rounded-lg"
          >
            <option value="AVAILABLE">Available</option>
            <option value="RENTED">Rented</option>
            <option value="SOLD">Sold</option>
            <option value="SCRAP">Scrap</option>
            <option value="DEMO">Demo</option>
          </select>
        </div>

      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Description / Notes
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          className="w-full px-4 py-2 border border-neutral-200 rounded-lg"
        />
      </div>

      <div className="flex justify-end gap-3 border-t pt-4">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : laptop ? "Update Laptop" : "Add Laptop"}
        </Button>
      </div>
    </form>
  );
}