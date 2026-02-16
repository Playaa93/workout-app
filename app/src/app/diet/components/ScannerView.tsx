'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import ArrowBack from '@mui/icons-material/ArrowBack';
import { lookupBarcode, addFoodEntry } from '../actions';
import { triggerHaptic, MEAL_CONFIG } from './shared';
import type { FoodData, MealType } from './shared';

type ScanState = 'scanning' | 'found' | 'not-found' | 'confirm';

export default function ScannerView({
  mealType,
  onAdd,
  onClose,
  onSwitchToSearch,
}: {
  mealType: MealType;
  onAdd: (data: Parameters<typeof addFoodEntry>[0]) => void;
  onClose: () => void;
  onSwitchToSearch: () => void;
}) {
  const [state, setState] = useState<ScanState>('scanning');
  const [food, setFood] = useState<FoodData | null>(null);
  const [quantity, setQuantity] = useState('100');
  const [manualBarcode, setManualBarcode] = useState('');
  const [isLooking, setIsLooking] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<unknown>(null);

  const handleBarcode = useCallback(async (barcode: string) => {
    if (isLooking) return;
    setIsLooking(true);
    triggerHaptic('medium');

    try {
      const result = await lookupBarcode(barcode);
      if (result) {
        setFood(result);
        setState('found');
      } else {
        setState('not-found');
      }
    } catch {
      setState('not-found');
    } finally {
      setIsLooking(false);
    }
  }, [isLooking]);

  useEffect(() => {
    let scanner: { clear: () => Promise<void>; stop: () => Promise<void> } | null = null;

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (!scannerRef.current) return;

        const qrScanner = new Html5Qrcode('scanner-region');
        html5QrCodeRef.current = qrScanner;
        scanner = qrScanner as unknown as typeof scanner;

        await qrScanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText) => {
            handleBarcode(decodedText);
            qrScanner.stop().catch(() => {});
          },
          () => {}
        );
      } catch {
        // Camera not available, fallback to manual input
      }
    };

    if (state === 'scanning') {
      startScanner();
    }

    return () => {
      if (scanner) {
        scanner.stop().catch(() => {});
      }
    };
  }, [state, handleBarcode]);

  const handleManualLookup = () => {
    if (manualBarcode.length >= 8) {
      handleBarcode(manualBarcode);
    }
  };

  const handleConfirmAdd = () => {
    if (!food) return;
    const qty = parseFloat(quantity) || 100;
    const multiplier = qty / 100;

    onAdd({
      foodId: food.id,
      mealType,
      quantity: qty,
      calories: food.calories ? parseFloat(food.calories) * multiplier : undefined,
      protein: food.protein ? parseFloat(food.protein) * multiplier : undefined,
      carbohydrates: food.carbohydrates ? parseFloat(food.carbohydrates) * multiplier : undefined,
      fat: food.fat ? parseFloat(food.fat) * multiplier : undefined,
    });
  };

  const meal = MEAL_CONFIG[mealType];

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ pt: 1.5, pb: 1, px: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box
            onClick={onClose}
            sx={{
              cursor: 'pointer',
              p: 0.5,
              display: 'flex',
              alignItems: 'center',
              color: 'text.secondary',
              '&:active': { opacity: 0.5 },
            }}
          >
            <ArrowBack sx={{ fontSize: 24 }} />
          </Box>
          <Typography sx={{ fontWeight: 600, fontSize: '1.1rem' }}>Scanner</Typography>
          <Chip label={meal.label} size="small" sx={{ bgcolor: `${meal.color}15`, color: meal.color, fontWeight: 600 }} />
        </Stack>
      </Box>

      <Box sx={{ flex: 1, p: 2 }}>
        {state === 'scanning' && (
          <Stack spacing={2}>
            <Box
              id="scanner-region"
              ref={scannerRef}
              sx={{
                width: '100%',
                maxWidth: 400,
                mx: 'auto',
                borderRadius: 2,
                overflow: 'hidden',
                bgcolor: 'black',
                minHeight: 250,
              }}
            />

            {isLooking && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}

            <Typography variant="body2" color="text.secondary" textAlign="center">
              Place le code-barres devant la caméra
            </Typography>

            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Ou saisir manuellement :
              </Typography>
              <Stack direction="row" spacing={1}>
                <TextField
                  size="small"
                  placeholder="Code-barres (ex: 3017620422003)"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  fullWidth
                  type="number"
                />
                <Button
                  variant="contained"
                  onClick={handleManualLookup}
                  disabled={manualBarcode.length < 8 || isLooking}
                  sx={{ minWidth: 80 }}
                >
                  OK
                </Button>
              </Stack>
            </Box>
          </Stack>
        )}

        {state === 'found' && food && (
          <Stack spacing={3}>
            <Typography variant="h6" fontWeight={600}>
              {food.nameFr}
            </Typography>
            {food.brand && (
              <Typography variant="body2" color="text.secondary">
                {food.brand}
              </Typography>
            )}

            <TextField
              label="Quantité (g)"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              fullWidth
            />

            <Card>
              <CardContent>
                {(() => {
                  const multiplier = (parseFloat(quantity) || 100) / 100;
                  const cal = food.calories ? parseFloat(food.calories) * multiplier : 0;
                  return (
                    <>
                      <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
                        {Math.round(cal)} kcal
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Protéines</Typography>
                          <Typography variant="body2">
                            {food.protein ? Math.round(parseFloat(food.protein) * multiplier) : 0}g
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Glucides</Typography>
                          <Typography variant="body2">
                            {food.carbohydrates ? Math.round(parseFloat(food.carbohydrates) * multiplier) : 0}g
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Lipides</Typography>
                          <Typography variant="body2">
                            {food.fat ? Math.round(parseFloat(food.fat) * multiplier) : 0}g
                          </Typography>
                        </Box>
                      </Box>
                    </>
                  );
                })()}
              </CardContent>
            </Card>

            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                onClick={() => {
                  setFood(null);
                  setState('scanning');
                  setManualBarcode('');
                }}
                sx={{ flex: 1 }}
              >
                Re-scanner
              </Button>
              <Box
                onClick={handleConfirmAdd}
                sx={{
                  flex: 2,
                  py: 1.5,
                  textAlign: 'center',
                  bgcolor: 'text.primary',
                  color: 'background.default',
                  borderRadius: 2,
                  fontWeight: 600,
                  cursor: 'pointer',
                  '&:active': { opacity: 0.8, transform: 'scale(0.98)' },
                }}
              >
                Ajouter
              </Box>
            </Stack>
          </Stack>
        )}

        {state === 'not-found' && (
          <Stack spacing={3} sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h5">😕</Typography>
            <Typography variant="h6" fontWeight={600}>
              Produit non trouvé
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ce code-barres n&apos;est pas dans notre base de données.
            </Typography>
            <Stack spacing={1.5}>
              <Button
                variant="contained"
                onClick={onSwitchToSearch}
              >
                Chercher manuellement
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setState('scanning');
                  setManualBarcode('');
                }}
              >
                Réessayer
              </Button>
            </Stack>
          </Stack>
        )}
      </Box>
    </Box>
  );
}
