import { useQuery, useMutation } from "@tanstack/react-query";
import { type Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Plus, Pencil, Trash2, Upload, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  category: string;
  imageUrl: string;
  images: string[];
  modelUrl: string | null;
  inventory: { [key: string]: number };
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    price: "",
    category: "tees",
    imageUrl: "",
    images: [],
    modelUrl: null,
    inventory: { S: 10, M: 15, L: 12, XL: 8 },
  });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/admin/products"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product deleted",
        description: "Product has been deleted successfully",
      });
    },
  });

  const handleOpenDialog = (product?: Product) => {
    // Always reset file inputs to prevent stale file uploads
    setThumbnailFile(null);
    setGalleryFiles([]);
    setModelFile(null);

    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        imageUrl: product.imageUrl,
        images: product.images || [],
        modelUrl: product.modelUrl || null,
        inventory: product.inventory as { [key: string]: number },
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        description: "",
        price: "",
        category: "tees",
        imageUrl: "",
        images: [],
        modelUrl: null,
        inventory: { S: 10, M: 15, L: 12, XL: 8 },
      });
    }
    setIsDialogOpen(true);
  };

  const uploadFile = async (file: File, type: 'image' | 'model'): Promise<string> => {
    const formData = new FormData();
    const fieldName = type === 'image' ? 'image' : 'model';
    formData.append(fieldName, file);

    const response = await fetch(`/api/admin/uploads/${type}`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to upload ${type}`);
    }

    const data = await response.json();
    return data.url;
  };

  const uploadMultipleImages = async (files: File[]): Promise<string[]> => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    const response = await fetch('/api/admin/uploads/images', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to upload images');
    }

    const data = await response.json();
    return data.urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let thumbnailUrl = formData.imageUrl;
      let galleryUrls = formData.images;
      let modelUrl = formData.modelUrl;

      // Upload thumbnail if new file selected
      if (thumbnailFile) {
        thumbnailUrl = await uploadFile(thumbnailFile, 'image');
      }

      // Upload gallery images if new files selected - APPEND to existing
      if (galleryFiles.length > 0) {
        const newUrls = await uploadMultipleImages(galleryFiles);
        galleryUrls = [...formData.images, ...newUrls];
      }

      // Upload model if new file selected
      if (modelFile) {
        modelUrl = await uploadFile(modelFile, 'model');
      }

      const productData = {
        ...formData,
        imageUrl: thumbnailUrl,
        images: galleryUrls,
        modelUrl: modelUrl,
        price: formData.price,
      };

      if (editingProduct) {
        await apiRequest("PATCH", `/api/admin/products/${editingProduct.id}`, productData);
        toast({
          title: "Product updated",
          description: "Product has been updated successfully",
        });
      } else {
        await apiRequest("POST", "/api/admin/products", productData);
        toast({
          title: "Product created",
          description: "Product has been created successfully",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      
      // Clear file inputs after successful submit
      setThumbnailFile(null);
      setGalleryFiles([]);
      setModelFile(null);
      
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save product",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleRemoveGalleryImage = async (imageUrl: string) => {
    if (!editingProduct) {
      // Just remove from form data if creating new product
      setFormData({
        ...formData,
        images: formData.images.filter(img => img !== imageUrl)
      });
      return;
    }

    // For existing products, update on server
    try {
      const updatedImages = formData.images.filter(img => img !== imageUrl);
      await apiRequest("PATCH", `/api/admin/products/${editingProduct.id}`, {
        images: updatedImages
      });
      
      setFormData({
        ...formData,
        images: updatedImages
      });

      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      
      toast({
        title: "Image removed",
        description: "Gallery image has been removed successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove image",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen digital-matrix-bg pt-24 pb-16">
      <div className="container mx-auto px-8 md:px-16 max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <h1 
            className="text-4xl md:text-5xl font-bold uppercase tracking-wider text-white drop-shadow-[0_6px_12px_rgba(0,0,0,1)]"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
            data-testid="text-admin-title"
          >
            ADMIN DASHBOARD
          </h1>
          <Button
            onClick={() => handleOpenDialog()}
            data-testid="button-add-product"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="border border-primary/30 rounded-md p-6 animate-pulse">
                <div className="h-48 bg-muted rounded-md mb-4" />
                <div className="h-6 bg-muted rounded-md mb-2" />
                <div className="h-4 bg-muted rounded-md w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products?.map((product) => (
              <div
                key={product.id}
                className="border-2 border-primary/30 rounded-md p-6 backdrop-blur-sm hover-elevate"
                data-testid={`card-product-${product.id}`}
              >
                <div className="aspect-[3/4] rounded-md mb-4 overflow-hidden border border-primary/20">
                  <div className="w-full h-full flex items-center justify-center text-xs text-white/60">
                    {product.imageUrl}
                  </div>
                </div>
                <h3 
                  className="text-lg font-bold text-white mb-2 drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]"
                  style={{ fontFamily: "'Orbitron', sans-serif" }}
                >
                  {product.name}
                </h3>
                <p className="text-primary font-bold mb-2">${product.price}</p>
                <p className="text-sm text-white/70 mb-4 line-clamp-2">{product.description}</p>
                {product.modelUrl && (
                  <p className="text-xs text-primary mb-4">3D Model Available</p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDialog(product)}
                    data-testid={`button-edit-${product.id}`}
                    className="flex-1"
                  >
                    <Pencil className="w-3 h-3 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(product.id)}
                    data-testid={`button-delete-${product.id}`}
                    className="flex-1"
                  >
                    <Trash2 className="w-3 h-3 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Edit Product" : "Add New Product"}
              </DialogTitle>
              <DialogDescription>
                {editingProduct ? "Update product details" : "Create a new product"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  data-testid="input-product-name"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={4}
                  data-testid="input-product-description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    data-testid="input-product-price"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger data-testid="select-product-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tees">Tees</SelectItem>
                      <SelectItem value="hoodies">Hoodies</SelectItem>
                      <SelectItem value="longsleeves">Longsleeves</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="thumbnail">Thumbnail Image</Label>
                <Input
                  id="thumbnail"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                  data-testid="input-product-thumbnail"
                />
                {formData.imageUrl && !thumbnailFile && (
                  <p className="text-xs text-muted-foreground mt-1">Current: {formData.imageUrl}</p>
                )}
              </div>

              <div>
                <Label htmlFor="gallery">Add Gallery Images</Label>
                <Input
                  id="gallery"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setGalleryFiles(Array.from(e.target.files || []))}
                  data-testid="input-product-gallery"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Select one or multiple images to add to gallery
                </p>
                
                {formData.images.length > 0 && (
                  <div className="mt-4">
                    <Label className="text-sm">Current Gallery ({formData.images.length})</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {formData.images.map((imageUrl, index) => (
                        <div
                          key={index}
                          className="relative group border border-border rounded-md overflow-hidden aspect-square"
                        >
                          <div className="w-full h-full flex items-center justify-center bg-muted p-2">
                            <p className="text-xs text-center break-all line-clamp-3">{imageUrl.split('/').pop()}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveGalleryImage(imageUrl)}
                            className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            data-testid={`button-remove-gallery-${index}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="model">3D Model (.glb)</Label>
                <Input
                  id="model"
                  type="file"
                  accept=".glb"
                  onChange={(e) => setModelFile(e.target.files?.[0] || null)}
                  data-testid="input-product-model"
                />
                {formData.modelUrl && !modelFile && (
                  <p className="text-xs text-muted-foreground mt-1">Current: {formData.modelUrl}</p>
                )}
              </div>

              <div>
                <Label>Inventory</Label>
                <div className="grid grid-cols-4 gap-2">
                  {['S', 'M', 'L', 'XL'].map((size) => (
                    <div key={size}>
                      <Label htmlFor={`inv-${size}`} className="text-xs">{size}</Label>
                      <Input
                        id={`inv-${size}`}
                        type="number"
                        value={formData.inventory[size] || 0}
                        onChange={(e) => setFormData({
                          ...formData,
                          inventory: { ...formData.inventory, [size]: parseInt(e.target.value) || 0 }
                        })}
                        data-testid={`input-inventory-${size}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} data-testid="button-submit-product">
                  {isSubmitting ? "Saving..." : (editingProduct ? "Update" : "Create")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
