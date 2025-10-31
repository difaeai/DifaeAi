
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MoreHorizontal, PlusCircle, Loader2, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Product } from "@/lib/types";
import Image from "next/image";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, setDoc, getDoc, query, orderBy } from "firebase/firestore";

async function getProducts(): Promise<Product[]> {
    const productsCollection = collection(db, 'products');
    const q = query(productsCollection, orderBy("name"));
    const productsSnapshot = await getDocs(q);
    if (productsSnapshot.empty) return [];
    return productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
}

async function addProduct(productData: Omit<Product, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'products'), productData);
    return docRef.id;
}

async function updateProduct(productId: string, productData: Partial<Omit<Product, 'id'>>): Promise<void> {
    await updateDoc(doc(db, 'products', productId), productData);
}

async function deleteProduct(productId: string): Promise<void> {
    const productDoc = doc(db, 'products', productId);
    await deleteDoc(productDoc);
}

async function getPageContent(pageName: string): Promise<any> {
    const docRef = doc(db, 'content', pageName);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return docSnap.data();
    return {};
}

async function savePageContent(pageName: string, content: any): Promise<void> {
    await setDoc(doc(db, 'content', pageName), content, { merge: true });
}


const emptyProduct: Partial<Product> = {
    name: '',
    title: '',
    price: 0,
    priceDescription: '',
    subscription: '',
    description: '',
    longDescription: '',
    features: [],
    idealFor: '',
    hints: [],
    primaryActionText: 'Purchase',
    secondaryActionText: '',
    secondaryActionLink: '',
    images: [],
};


export default function SiteContentPage() {
    const { toast } = useToast();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Partial<Product>>(emptyProduct);
    const [pageContents, setPageContents] = useState<any>({});
    const [isSavingContent, setIsSavingContent] = useState<Record<string, boolean>>({});
    const [productToDelete, setProductToDelete] = useState<string | null>(null);

    const getSafe = (obj: any, path: string[], defaultValue: any = '') => {
        return path.reduce((xs, x) => (xs && xs[x] !== undefined && xs[x] !== null) ? xs[x] : defaultValue, obj);
    }
    
    useEffect(() => {
        const fetchAllContent = async () => {
            const pages = ['homepage', 'aboutpage', 'agentpage', 'contactpage', 'global'];
            const contentPromises = pages.map(page => getPageContent(page).catch(e => {
                console.error(`Failed to fetch '${page}'`, e);
                return {}; 
            }));
            
            try {
                const fetchedContents = await Promise.all(contentPromises);
                
                let newContent: any = {};
                 pages.forEach((page, index) => {
                    newContent[page] = fetchedContents[index] || {};
                });
                setPageContents(newContent);
            } catch (error) {
                console.error("Error processing fetched content:", error);
                toast({ variant: "destructive", title: "Error", description: "Could not load all website content."});
            }
        };
        fetchAllContent();
    }, [toast]);

    const handleContentChange = (page: string, section: string, key: string, value: string | string[]) => {
        setPageContents((prev: any) => {
            const newContents = JSON.parse(JSON.stringify(prev));
            if (!newContents[page]) newContents[page] = {};
            if (!newContents[page][section]) newContents[page][section] = {};
            newContents[page][section][key] = value;
            return newContents;
        });
    };

    const handleSaveContent = async (pageName: string) => {
        setIsSavingContent(prev => ({ ...prev, [pageName]: true }));
    
        try {
            const contentToSave = pageContents[pageName] || {};
            await savePageContent(pageName, contentToSave);
            
            toast({
                title: "Content Saved!",
                description: `Content for the ${pageName} page has been updated successfully.`,
            });
    
        } catch (error) {
            console.error(`Save content error for ${pageName}:`, error);
            const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
            toast({
                variant: "destructive",
                title: "Save Failed",
                description: errorMessage,
            });
        } finally {
            setIsSavingContent(prev => ({ ...prev, [pageName]: false }));
        }
    };
    
    const fetchProducts = useCallback(async () => {
      setIsLoadingProducts(true);
      try {
          let fetchedProducts = await getProducts();
          setProducts(fetchedProducts);
      } catch (error) {
          toast({ variant: 'destructive', title: 'Failed to load products' });
      } finally {
          setIsLoadingProducts(false);
      }
    }, [toast]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleAddProduct = () => {
        setEditingProduct(emptyProduct); 
        setIsDialogOpen(true);
    };

    const handleEditProduct = (product: Product) => {
        setEditingProduct(product);
        setIsDialogOpen(true);
    };
    
    const handleDeleteProduct = async () => {
        if (!productToDelete) return;

        try {
            await deleteProduct(productToDelete);
            toast({ title: 'Product Deleted', description: 'The product has been removed successfully.' });
            await fetchProducts();
        } catch (error) {
            console.error("Delete product error:", error);
            const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
            toast({ variant: 'destructive', title: 'Delete Failed', description: errorMessage });
        } finally {
            setProductToDelete(null);
        }
    };
    
    const handleProductFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingProduct) {
            toast({ variant: 'destructive', title: 'Save Failed', description: 'No product data to save.' });
            return;
        }

        setIsSaving(true);
        
        const form = e.target as HTMLFormElement;
        const featuresString = (form.elements.namedItem('features') as HTMLTextAreaElement).value;
        const featuresArray = featuresString.split('\n').filter((f: string) => f.trim() !== '');

        const hintsString = (form.elements.namedItem('hints') as HTMLInputElement).value;
        const hintsArray = hintsString.split(',').map((h: string) => h.trim()).filter(Boolean);

        const productData: Omit<Product, 'id'> = {
            name: editingProduct.name || '',
            title: editingProduct.title || '',
            price: Number(editingProduct.price) || 0,
            priceDescription: editingProduct.priceDescription || '',
            subscription: editingProduct.subscription || '',
            description: editingProduct.description || '',
            longDescription: editingProduct.longDescription || '',
            features: featuresArray,
            idealFor: editingProduct.idealFor || '',
            hints: hintsArray,
            primaryActionText: editingProduct.primaryActionText || 'Buy Now',
            secondaryActionText: editingProduct.secondaryActionText || '',
            secondaryActionLink: editingProduct.secondaryActionLink || '',
            images: editingProduct.images || [],
        };

        if (!productData.name || !productData.title) {
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Name and Title are required.'});
            setIsSaving(false);
            return;
        }

        try {
            if (editingProduct.id) {
                await updateProduct(editingProduct.id, productData);
                toast({ title: 'Product Updated' });
            } else {
                await addProduct(productData);
                toast({ title: 'Product Added' });
            }
            await fetchProducts();
            setIsDialogOpen(false);
            setEditingProduct(emptyProduct);
        } catch (error) {
             console.error("Save product error:", error);
             const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
             toast({ variant: 'destructive', title: 'Could not save the product', description: errorMessage });
        } finally {
            setIsSaving(false);
        }
    };

    const handleProductInputChange = (field: keyof Omit<Product, 'features' | 'id' | 'images' | 'hints'>, value: string | number) => {
        setEditingProduct(prev => ({...prev, [field]: value }));
    };
    
    const handleProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const fileArray = Array.from(files);
        const MAX_SIZE_MB = 3;
        const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
        
        fileArray.forEach(file => {
            if (file.size > MAX_SIZE_BYTES) {
                toast({
                    variant: "destructive",
                    title: "Image Too Large",
                    description: `The file "${file.name}" is too large. Please upload images smaller than ${MAX_SIZE_MB}MB.`,
                });
                return; // Skip this file
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setEditingProduct(prev => ({
                    ...prev,
                    images: [...(prev?.images || []), reader.result as string]
                }));
            };
            reader.readAsDataURL(file);
        });

        // Clear the input value to allow re-uploading the same file if needed
        e.target.value = "";
    };

    const removeProductImage = (index: number) => {
        setEditingProduct(prev => {
            const newImages = [...(prev?.images || [])];
            newImages.splice(index, 1);
            return { ...prev, images: newImages };
        });
    };

    return (
        <div className="space-y-6">
            <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the product from your database.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setProductToDelete(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteProduct}>Delete</AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Tabs defaultValue="homepage" className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="homepage">Home</TabsTrigger>
                <TabsTrigger value="aboutpage">About</TabsTrigger>
                <TabsTrigger value="agentpage">Agent</TabsTrigger>
                <TabsTrigger value="productspage">Products</TabsTrigger>
                <TabsTrigger value="contactpage">Contact</TabsTrigger>
                <TabsTrigger value="global">Global</TabsTrigger>
                </TabsList>

                <TabsContent value="homepage">
                <Card>
                    <CardHeader>
                    <CardTitle>Home Page Content</CardTitle>
                    <CardDescription>Manage the content for the main landing page.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
                        <Card>
                            <CardHeader><CardTitle className="text-lg">Hero Section</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2"><Label>Pre-headline</Label><Input value={getSafe(pageContents, ['homepage', 'hero', 'preHeadline'])} onChange={e => handleContentChange('homepage', 'hero', 'preHeadline', e.target.value)} /></div>
                                <div className="space-y-2"><Label>Headline</Label><Input value={getSafe(pageContents, ['homepage', 'hero', 'headline'])} onChange={e => handleContentChange('homepage', 'hero', 'headline', e.target.value)} /></div>
                                <div className="space-y-2"><Label>Description</Label><Textarea value={getSafe(pageContents, ['homepage', 'hero', 'description'])} onChange={e => handleContentChange('homepage', 'hero', 'description', e.target.value)} /></div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle className="text-lg">Features Section</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2"><Label>Headline</Label><Input value={getSafe(pageContents, ['homepage', 'features', 'headline'])} onChange={e => handleContentChange('homepage', 'features', 'headline', e.target.value)} /></div>
                                <div className="space-y-2"><Label>Description</Label><Textarea value={getSafe(pageContents, ['homepage', 'features', 'description'])} onChange={e => handleContentChange('homepage', 'features', 'description', e.target.value)} /></div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle className="text-lg">How It Works Section</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2"><Label>Headline</Label><Input value={getSafe(pageContents, ['homepage', 'howItWorks', 'headline'])} onChange={e => handleContentChange('homepage', 'howItWorks', 'headline', e.target.value)} /></div>
                                <div className="space-y-2"><Label>Description</Label><Textarea value={getSafe(pageContents, ['homepage', 'howItWorks', 'description'])} onChange={e => handleContentChange('homepage', 'howItWorks', 'description', e.target.value)} /></div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle className="text-lg">Use Cases Section</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2"><Label>Headline</Label><Input value={getSafe(pageContents, ['homepage', 'useCases', 'headline'])} onChange={e => handleContentChange('homepage', 'useCases', 'headline', e.target.value)} /></div>
                                <div className="space-y-2"><Label>Description</Label><Textarea value={getSafe(pageContents, ['homepage', 'useCases', 'description'])} onChange={e => handleContentChange('homepage', 'useCases', 'description', e.target.value)} /></div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle className="text-lg">CTA Section</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2"><Label>Headline</Label><Input value={getSafe(pageContents, ['homepage', 'cta', 'headline'])} onChange={e => handleContentChange('homepage', 'cta', 'headline', e.target.value)} /></div>
                                <div className="space-y-2"><Label>Description</Label><Textarea value={getSafe(pageContents, ['homepage', 'cta', 'description'])} onChange={e => handleContentChange('homepage', 'cta', 'description', e.target.value)} /></div>
                            </CardContent>
                        </Card>
                    </CardContent>
                    <CardFooter>
                    <Button onClick={() => handleSaveContent("homepage")} disabled={isSavingContent['homepage']}>
                        {isSavingContent['homepage'] && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Save Home Page
                    </Button>
                    </CardFooter>
                </Card>
                </TabsContent>

                <TabsContent value="aboutpage">
                    <Card>
                        <CardHeader>
                            <CardTitle>About Page Content</CardTitle>
                            <CardDescription>Manage the content for the "About Us" page.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
                            <Card>
                                <CardHeader><CardTitle className="text-lg">Hero Section</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2"><Label>Headline</Label><Input value={getSafe(pageContents, ['aboutpage', 'hero', 'headline'])} onChange={e => handleContentChange('aboutpage', 'hero', 'headline', e.target.value)} /></div>
                                    <div className="space-y-2"><Label>Description</Label><Textarea value={getSafe(pageContents, ['aboutpage', 'hero', 'description'])} onChange={e => handleContentChange('aboutpage', 'hero', 'description', e.target.value)} /></div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle className="text-lg">Our Story</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2"><Label>Headline</Label><Input value={getSafe(pageContents, ['aboutpage', 'story', 'headline'])} onChange={e => handleContentChange('aboutpage', 'story', 'headline', e.target.value)} /></div>
                                    <div className="space-y-2"><Label>Paragraph 1</Label><Textarea value={getSafe(pageContents, ['aboutpage', 'story', 'p1'])} onChange={e => handleContentChange('aboutpage', 'story', 'p1', e.target.value)} /></div>
                                    <div className="space-y-2"><Label>Paragraph 2</Label><Textarea value={getSafe(pageContents, ['aboutpage', 'story', 'p2'])} onChange={e => handleContentChange('aboutpage', 'story', 'p2', e.target.value)} /></div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle className="text-lg">Mission &amp; Vision</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2"><Label>Mission Text</Label><Textarea value={getSafe(pageContents, ['aboutpage', 'missionVision', 'mission'])} onChange={e => handleContentChange('aboutpage', 'missionVision', 'mission', e.target.value)} /></div>
                                    <div className="space-y-2"><Label>Vision Text</Label><Textarea value={getSafe(pageContents, ['aboutpage', 'missionVision', 'vision'])} onChange={e => handleContentChange('aboutpage', 'missionVision', 'vision', e.target.value)} /></div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle className="text-lg">CTA Section</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2"><Label>Headline</Label><Input value={getSafe(pageContents, ['aboutpage', 'cta', 'headline'])} onChange={e => handleContentChange('aboutpage', 'cta', 'headline', e.target.value)} /></div>
                                    <div className="space-y-2"><Label>Description</Label><Textarea value={getSafe(pageContents, ['aboutpage', 'cta', 'description'])} onChange={e => handleContentChange('aboutpage', 'cta', 'description', e.target.value)} /></div>
                                </CardContent>
                            </Card>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={() => handleSaveContent("aboutpage")} disabled={isSavingContent['aboutpage']}>
                                {isSavingContent['aboutpage'] && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Save About Page
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="agentpage">
                    <Card>
                        <CardHeader>
                            <CardTitle>DIFAE AI Agent Page Content</CardTitle>
                            <CardDescription>Manage the content for the AI Agent page.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
                            <Card>
                                <CardHeader><CardTitle className="text-lg">Hero Section</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2"><Label>Headline</Label><Input value={getSafe(pageContents, ['agentpage', 'hero', 'headline'])} onChange={e => handleContentChange('agentpage', 'hero', 'headline', e.target.value)} /></div>
                                    <div className="space-y-2"><Label>Sub-headline</Label><Input value={getSafe(pageContents, ['agentpage', 'hero', 'subHeadline'])} onChange={e => handleContentChange('agentpage', 'hero', 'subHeadline', e.target.value)} /></div>
                                    <div className="space-y-2"><Label>Description</Label><Textarea value={getSafe(pageContents, ['agentpage', 'hero', 'description'])} onChange={e => handleContentChange('agentpage', 'hero', 'description', e.target.value)} /></div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle className="text-lg">How it Works Section</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2"><Label>Headline</Label><Input value={getSafe(pageContents, ['agentpage', 'howItWorks', 'headline'])} onChange={e => handleContentChange('agentpage', 'howItWorks', 'headline', e.target.value)} /></div>
                                    <div className="space-y-2"><Label>Description</Label><Textarea value={getSafe(pageContents, ['agentpage', 'howItWorks', 'description'])} onChange={e => handleContentChange('agentpage', 'howItWorks', 'description', e.target.value)} /></div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle className="text-lg">Proactive Protection Section</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2"><Label>Headline</Label><Input value={getSafe(pageContents, ['agentpage', 'protection', 'headline'])} onChange={e => handleContentChange('agentpage', 'protection', 'headline', e.target.value)} /></div>
                                    <div className="space-y-2"><Label>Bullet Points (one per line)</Label><Textarea rows={5} value={getSafe(pageContents, ['agentpage', 'protection', 'bullets'], []).join('\n')} onChange={e => handleContentChange('agentpage', 'protection', 'bullets', e.target.value.split('\n'))} /></div>
                                </CardContent>
                            </Card>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={() => handleSaveContent("agentpage")} disabled={isSavingContent['agentpage']}>
                                {isSavingContent['agentpage'] && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Save Agent Page
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="productspage">
                <Card>
                    <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div>
                        <CardTitle>Product Management</CardTitle>
                        <CardDescription>
                        Manage your product catalog. Add, edit, or delete existing products.
                        </CardDescription>
                    </div>
                    <Button onClick={handleAddProduct} className="shrink-0">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Product
                    </Button>
                    </CardHeader>
                    <CardContent>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Image</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>
                            <span className="sr-only">Actions</span>
                            </TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {isLoadingProducts ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                <Loader2 className="mx-auto h-6 w-6 animate-spin"/>
                                </TableCell>
                            </TableRow>
                        ) : products.length > 0 ? (
                            products.map((product) => (
                            <TableRow key={product.id}>
                                <TableCell>
                                    <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                                        {(product.images && product.images.length > 0) ? (
                                            <Image src={product.images[0]} alt={product.name} width={64} height={64} className="object-cover" />
                                        ) : (
                                            <span className="text-xs text-muted-foreground">No Image</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell>Rs {product.price.toLocaleString()}</TableCell>
                                <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Toggle menu</span>
                                    </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onSelect={() => handleEditProduct(product)}>Edit Details</DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => setProductToDelete(product.id)} className="text-destructive">
                                        Delete Product
                                    </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                </TableCell>
                            </TableRow>
                            ))
                        ) : (
                            <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                No products found. Add a product to get started.
                            </TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                    </CardContent>
                </Card>
                </TabsContent>

                <TabsContent value="contactpage">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Page Content</CardTitle>
                            <CardDescription>Manage contact information and headlines.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
                            <Card>
                                <CardHeader><CardTitle className="text-lg">Hero Section</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2"><Label>Headline</Label><Input value={getSafe(pageContents, ['contactpage', 'hero', 'headline'])} onChange={e => handleContentChange('contactpage', 'hero', 'headline', e.target.value)} /></div>
                                    <div className="space-y-2"><Label>Description</Label><Textarea value={getSafe(pageContents, ['contactpage', 'hero', 'description'])} onChange={e => handleContentChange('contactpage', 'hero', 'description', e.target.value)} /></div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle className="text-lg">Contact Details</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2"><Label>General Inquiries Email</Label><Input value={getSafe(pageContents, ['contactpage', 'details', 'generalEmail'])} onChange={e => handleContentChange('contactpage', 'details', 'generalEmail', e.target.value)} /></div>
                                    <div className="space-y-2"><Label>General Inquiries Phone</Label><Input value={getSafe(pageContents, ['contactpage', 'details', 'generalPhone'])} onChange={e => handleContentChange('contactpage', 'details', 'generalPhone', e.target.value)} /></div>
                                    <div className="space-y-2"><Label>Support Hours</Label><Input value={getSafe(pageContents, ['contactpage', 'details', 'supportHours'])} onChange={e => handleContentChange('contactpage', 'details', 'supportHours', e.target.value)} /></div>
                                    <div className="space-y-2"><Label>Technical Support Phone</Label><Input value={getSafe(pageContents, ['contactpage', 'details', 'techPhone'])} onChange={e => handleContentChange('contactpage', 'details', 'techPhone', e.target.value)} /></div>
                                    <div className="space-y-2"><Label>Technical Support Email</Label><Input value={getSafe(pageContents, ['contactpage', 'details', 'techEmail'])} onChange={e => handleContentChange('contactpage', 'details', 'techEmail', e.target.value)} /></div>
                                    <div className="space-y-2"><Label>Office Address</Label><Textarea value={getSafe(pageContents, ['contactpage', 'details', 'address'])} onChange={e => handleContentChange('contactpage', 'details', 'address', e.target.value)} /></div>
                                </CardContent>
                            </Card>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={() => handleSaveContent("contactpage")} disabled={isSavingContent['contactpage']}>
                                {isSavingContent['contactpage'] && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Save Contact Page
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="global">
                <Card>
                    <CardHeader>
                        <CardTitle>Global Site Settings</CardTitle>
                        <CardDescription>These settings apply across the entire site, including the header and footer.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Card>
                            <CardHeader><CardTitle className="text-lg">Footer Settings</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2"><Label>Tagline</Label><Input value={getSafe(pageContents, ['global', 'footer', 'tagline'])} onChange={e => handleContentChange('global', 'footer', 'tagline', e.target.value)} /></div>
                                <div className="space-y-2"><Label>Facebook URL</Label><Input value={getSafe(pageContents, ['global', 'footer', 'facebookUrl'])} onChange={e => handleContentChange('global', 'footer', 'facebookUrl', e.target.value)} /></div>
                                <div className="space-y-2"><Label>Instagram URL</Label><Input value={getSafe(pageContents, ['global', 'footer', 'instagramUrl'])} onChange={e => handleContentChange('global', 'footer', 'instagramUrl', e.target.value)} /></div>
                                <div className="space-y-2"><Label>LinkedIn URL</Label><Input value={getSafe(pageContents, ['global', 'footer', 'linkedinUrl'])} onChange={e => handleContentChange('global', 'footer', 'linkedinUrl', e.target.value)} /></div>
                                <div className="space-y-2"><Label>Twitter URL</Label><Input value={getSafe(pageContents, ['global', 'footer', 'twitterUrl'])} onChange={e => handleContentChange('global', 'footer', 'twitterUrl', e.target.value)} /></div>
                            </CardContent>
                        </Card>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={() => handleSaveContent("global")} disabled={isSavingContent['global']}>
                            {isSavingContent['global'] && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Save Global Settings
                        </Button>
                    </CardFooter>
                </Card>
                </TabsContent>
            </Tabs>
            
            <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
                setIsDialogOpen(isOpen);
                if (!isOpen) {
                    setEditingProduct(emptyProduct);
                }
            }}>
                <DialogContent className="sm:max-w-[625px]">
                <form onSubmit={handleProductFormSubmit}>
                    <DialogHeader>
                    <CardTitle>{editingProduct?.id ? 'Edit Product Details' : 'Add New Product'}</CardTitle>
                    <CardDescription>
                        {editingProduct?.id ? 'Update the details for this product.' : "Fill in the details for the new product."}
                    </CardDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Name</Label>
                            <Input name="name" className="col-span-3" value={editingProduct?.name ?? ''} onChange={e => handleProductInputChange('name', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Title</Label>
                            <Input name="title" className="col-span-3" value={editingProduct?.title ?? ''} onChange={e => handleProductInputChange('title', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Price (Rs)</Label>
                            <Input name="price" type="number" className="col-span-3" value={editingProduct?.price ?? 0} onChange={e => handleProductInputChange('price', Number(e.target.value))} />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Price Desc.</Label>
                            <Input name="priceDescription" placeholder="/ month" className="col-span-3" value={editingProduct?.priceDescription ?? ''} onChange={e => handleProductInputChange('priceDescription', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Subscription</Label>
                            <Input name="subscription" placeholder="e.g. + Rs 300 / month" className="col-span-3" value={editingProduct?.subscription ?? ''} onChange={e => handleProductInputChange('subscription', e.target.value)}/>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Short Desc.</Label>
                            <Textarea name="description" placeholder="A short description for the product card" className="col-span-3" value={editingProduct?.description ?? ''} onChange={e => handleProductInputChange('description', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Long Desc.</Label>
                            <Textarea name="longDescription" placeholder="Detailed description for the product page" className="col-span-3" value={editingProduct?.longDescription ?? ''} onChange={e => handleProductInputChange('longDescription', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="features" className="text-right pt-2">Features</Label>
                            <Textarea
                                id="features"
                                name="features"
                                placeholder="One feature per line"
                                className="col-span-3"
                                rows={5}
                                defaultValue={Array.isArray(editingProduct?.features) ? editingProduct.features.join('\n') : ''}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Ideal For</Label>
                            <Input name="idealFor" className="col-span-3" value={editingProduct?.idealFor ?? ''} onChange={e => handleProductInputChange('idealFor', e.target.value)} />
                        </div>
                         <div className="grid grid-cols-4 items-start gap-4">
                            <Label className="text-right pt-2">Images</Label>
                            <div className="col-span-3 space-y-2">
                                <Input type="file" accept="image/*" onChange={handleProductImageChange} multiple />
                                {(editingProduct?.images && editingProduct.images.length > 0) && (
                                    <div className="mt-2 grid grid-cols-3 gap-2">
                                        {editingProduct.images.map((image, index) => (
                                            <div key={index} className="relative group">
                                                <Image src={image} alt={`Product preview ${index + 1}`} width={100} height={100} className="rounded-md border object-cover" />
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                                                    onClick={() => removeProductImage(index)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="hints" className="text-right">Image Hints</Label>
                            <Input id="hints" name="hints" placeholder="e.g. security camera, office" className="col-span-3" defaultValue={Array.isArray(editingProduct?.hints) ? editingProduct.hints.join(', ') : ''} />
                            <p className="col-start-2 col-span-3 text-xs text-muted-foreground">Comma-separated keywords for AI image search (e.g. camera, office security)</p>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Primary Button</Label>
                            <Input name="primaryActionText" placeholder="Button text" className="col-span-3" value={editingProduct?.primaryActionText ?? ''} onChange={e => handleProductInputChange('primaryActionText', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Secondary Button</Label>
                            <Input name="secondaryActionText" placeholder="Button text" className="col-span-3" value={editingProduct?.secondaryActionText ?? ''} onChange={e => handleProductInputChange('secondaryActionText', e.target.value)}/>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Secondary Link</Label>
                            <Input name="secondaryActionLink" placeholder="/contact" className="col-span-3" value={editingProduct?.secondaryActionLink ?? ''} onChange={e => handleProductInputChange('secondaryActionLink', e.target.value)}/>
                        </div>
                    </div>
                    <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="ghost" type="button">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        {isSaving ? 'Saving...' : 'Save Product'}
                    </Button>
                    </DialogFooter>
                </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

