// src/hooks/useViaCep.ts
import { useState } from "react";
import axios from "axios";

interface ViaCepData {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export const useViaCep = () => {
  const [address, setAddress] = useState<ViaCepData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAddress = async (cep: string) => {
    const cleanedCep = cep.replace(/\D/g, ""); // Remove caracteres não numéricos
    if (cleanedCep.length !== 8) {
      setError("CEP inválido.");
      setAddress(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<ViaCepData>(
        `https://viacep.com.br/ws/${cleanedCep}/json/`
      );
      if (response.data.erro) {
        setError("CEP não encontrado.");
        setAddress(null);
      } else {
        setAddress(response.data);
      } 
    } catch (err) {
      console.error("Erro na API ViaCEP:", err);

      if (err instanceof Error) {
        setError(`Não foi possível buscar o CEP: ${err.message}`);
      } else {
        setError("Ocorreu um erro desconhecido ao buscar o CEP.");
      }
      setAddress(null);
    } finally {
      setLoading(false);
    }
  };

  return { address, loading, error, fetchAddress };
};
