"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Save, Trash2 } from "lucide-react";
import { editarOrden } from "../ordenes/ordenes-actions";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { Textarea } from "@/components/ui/textarea";
interface DetalleOrden {
  producto_id: number;
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}
interface Orden {
  id?: number;
  usuario_id: string;
  nombre_cliente?: string;
  estado: string;
  metodo_pago: string;
  notas?: string;
  detalles: DetalleOrden[];
}
interface OrdenFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  orden?: Orden | null;
}
export default function OrdenFormModal({
  isOpen,
  onClose,
  onSuccess,
  orden,
}: OrdenFormModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [subtotal, setSubtotal] = useState(0);
  const [impuestos, setImpuestos] = useState(0);
  const [total, setTotal] = useState(0);

  const [formData, setFormData] = useState<Orden>({
    usuario_id: "",
    estado: "pendiente",
    metodo_pago: "efectivo",
    notas: "",
    detalles: [],
  });

  useEffect(() => {
    if (orden) {
      setFormData(orden);
      calcularTotales(orden.detalles);
    }
  }, [orden, isOpen]);

  const calcularTotales = (detalles: DetalleOrden[]) => {
    const subtotalCalculado = detalles.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );
    const impuestosCalculados = subtotalCalculado * 0.12;
    const totalCalculado = subtotalCalculado + impuestosCalculados;

    setSubtotal(Number.parseFloat(subtotalCalculado.toFixed(2)));
    setImpuestos(Number.parseFloat(impuestosCalculados.toFixed(2)));
    setTotal(Number.parseFloat(totalCalculado.toFixed(2)));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const updateCantidad = (index: number, cantidad: number) => {
    if (cantidad < 1) return;

    const newDetalles = [...formData.detalles];
    newDetalles[index].cantidad = cantidad;
    newDetalles[index].subtotal = cantidad * newDetalles[index].precio_unitario;
    setFormData((prev) => ({ ...prev, detalles: newDetalles }));
    calcularTotales(newDetalles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (orden?.id) {
        await editarOrden({ ...formData, id: orden.id });
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error("Error al actualizar la orden:", error);
      toast.error(
        "Error al actualizar la orden. Por favor, inténtalo de nuevo."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-amber-900">
            Editar Orden #{orden?.id}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Input
                value={formData.nombre_cliente || "Cliente no especificado"}
                disabled
                className="border-amber-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Select
                value={formData.estado}
                onValueChange={(value) => handleSelectChange("estado", value)}
                required
              >
                <SelectTrigger className="border-amber-200">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="preparando">Preparando</SelectItem>
                  <SelectItem value="completada">Completada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="metodo_pago">Método de Pago</Label>
              <Select
                value={formData.metodo_pago}
                onValueChange={(value) =>
                  handleSelectChange("metodo_pago", value)
                }
                required
              >
                <SelectTrigger className="border-amber-200">
                  <SelectValue placeholder="Seleccionar método de pago" />
                </SelectTrigger>
                <SelectContent>
                  {/* El valor que se guarda en la base de datos es 'efectivo', pero el usuario ve 'Efectivo' */}
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="tarjeta_credito">
                    Tarjeta de Crédito
                  </SelectItem>
                  <SelectItem value="tarjeta_debito">
                    Tarjeta de Débito
                  </SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notas">Notas</Label>
              <Textarea
                id="notas"
                name="notas"
                value={formData.notas || ""}
                onChange={handleChange}
                className="border-amber-200"
                rows={3}
              />
            </div>

            <div className="border border-amber-200 rounded-md overflow-hidden mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData.detalles.map((detalle, index) => (
                    <TableRow key={index}>
                      <TableCell>{detalle.nombre_producto}</TableCell>
                      <TableCell className="text-right">
                        ${detalle.precio_unitario.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="1"
                          value={detalle.cantidad}
                          onChange={(e) =>
                            updateCantidad(
                              index,
                              Number.parseInt(e.target.value)
                            )
                          }
                          className="w-16 text-right border-amber-200"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        ${detalle.subtotal.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-2 border-t border-amber-200 pt-4">
              <div className="flex justify-between">
                <span className="font-medium">Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Impuestos (12%):</span>
                <span>${impuestos.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-amber-700 hover:bg-amber-800"
              disabled={isLoading}
            >
              {isLoading ? (
                "Guardando..."
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Actualizar Orden
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
