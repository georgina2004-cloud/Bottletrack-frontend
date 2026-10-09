export interface BarcodeLookupResponse {
  existe_local: boolean;
  producto?: { id: number; nombre: string };
  found: boolean;
  nombre: string;
  marca: string;
  categoria_sugerida: string;
}
