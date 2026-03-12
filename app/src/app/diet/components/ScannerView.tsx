'use client';

import { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import { ArrowLeft, Barcode, MagnifyingGlass } from '@phosphor-icons/react';
import { alpha } from '@mui/material/styles';
import { useTheme } from 'next-themes';
import { tc, card, GOLD, GOLD_CONTRAST, W } from '@/lib/design-tokens';
import { lookupBarcode, addFoodEntry } from '../actions';
import { triggerHaptic, MACRO_COLORS } from './shared';
import type { FoodData, MealType } from './shared';

type ScanState = 'scanning' | 'found' | 'not-found';

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
  const { resolvedTheme } = useTheme();
  const d = resolvedTheme !== 'light';

  const [state, setState] = useState<ScanState>('scanning');
  const [food, setFood] = useState<FoodData | null>(null);
  const [quantity, setQuantity] = useState('100');
  const [manualBarcode, setManualBarcode] = useState('');
  const [isLooking, setIsLooking] = useState(false);
  const isLookingRef = useRef(false);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<unknown>(null);

  const handleBarcode = async (barcode: string) => {
    if (isLookingRef.current) return;
    isLookingRef.current = true;
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
      isLookingRef.current = false;
      setIsLooking(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (cancelled || !scannerRef.current) return;

        const qrScanner = new Html5Qrcode('scanner-region');
        html5QrCodeRef.current = qrScanner;

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
      cancelled = true;
      const qr = html5QrCodeRef.current as { stop?: () => Promise<void> } | null;
      if (qr?.stop) {
        qr.stop().catch(() => {});
        html5QrCodeRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

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

  const canSubmitBarcode = manualBarcode.length >= 8 && !isLooking;

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ px: 2, pt: 1, pb: 1.5 }}>
        <Stack direction="row" alignItems="center">
          <IconButton onClick={onClose} size="small" sx={{ color: tc.m(d), mr: 1 }}>
            <ArrowLeft size={20} weight={W} />
          </IconButton>
          <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: tc.h(d) }}>
            Scanner
          </Typography>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', px: 2, pb: 12 }}>
        {state === 'scanning' && (
          <Stack spacing={2}>
            {/* Camera viewfinder */}
            <Box
              id="scanner-region"
              ref={scannerRef}
              sx={{
                width: '100%',
                mx: 'auto',
                borderRadius: '14px',
                overflow: 'hidden',
                bgcolor: d ? '#111' : '#000',
                minHeight: 220,
                border: '1px solid',
                borderColor: d ? alpha('#ffffff', 0.1) : alpha('#000000', 0.08),
              }}
            />

            {isLooking && (
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ py: 1 }}>
                <CircularProgress size={16} sx={{ color: GOLD }} />
                <Typography sx={{ fontSize: '0.75rem', color: tc.f(d) }}>
                  Recherche...
                </Typography>
              </Stack>
            )}

            {!isLooking && (
              <Typography sx={{ textAlign: 'center', color: tc.f(d), fontSize: '0.75rem' }}>
                Place le code-barres devant la camera
              </Typography>
            )}

            {/* Manual input */}
            <Box sx={card(d, { p: 2, mt: 1 })}>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: tc.f(d), mb: 1, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                Saisie manuelle
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ position: 'relative', flex: 1 }}>
                  <Barcode size={16} weight={W} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: tc.f(d) }} />
                  <Box
                    component="input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={manualBarcode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setManualBarcode(e.target.value)}
                    placeholder="3017620422003"
                    sx={{
                      width: '100%',
                      py: 1.2,
                      pl: 4.5,
                      pr: 1.5,
                      borderRadius: '10px',
                      border: '1px solid',
                      borderColor: d ? alpha('#ffffff', 0.1) : alpha('#000000', 0.08),
                      bgcolor: 'transparent',
                      color: tc.h(d),
                      fontSize: '0.85rem',
                      fontFamily: 'inherit',
                      fontVariantNumeric: 'tabular-nums',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      '&:focus': { borderColor: GOLD },
                      '&::placeholder': { color: tc.f(d) },
                    }}
                  />
                </Box>
                <Box
                  onClick={canSubmitBarcode ? handleManualLookup : undefined}
                  sx={{
                    px: 2.5,
                    py: 1.2,
                    borderRadius: '10px',
                    bgcolor: canSubmitBarcode ? GOLD : (d ? alpha('#ffffff', 0.06) : alpha('#000000', 0.06)),
                    color: canSubmitBarcode ? GOLD_CONTRAST : tc.f(d),
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: canSubmitBarcode ? 'pointer' : 'default',
                    transition: 'all 0.15s',
                    ...(canSubmitBarcode && { '&:active': { transform: 'scale(0.96)' } }),
                  }}
                >
                  OK
                </Box>
              </Stack>
            </Box>
          </Stack>
        )}

        {state === 'found' && food && (
          <Stack spacing={2}>
            {/* Food name + brand */}
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: tc.h(d) }}>
                {food.nameFr}
              </Typography>
              {food.brand && (
                <Typography sx={{ fontSize: '0.7rem', color: tc.f(d), mt: 0.25 }}>
                  {food.brand}
                </Typography>
              )}
            </Box>

            {/* Calorie hero + macros */}
            {(() => {
              const multiplier = (parseFloat(quantity) || 0) / 100;
              const cal = food.calories ? parseFloat(food.calories) * multiplier : 0;
              const prot = food.protein ? parseFloat(food.protein) * multiplier : 0;
              const carbs = food.carbohydrates ? parseFloat(food.carbohydrates) * multiplier : 0;
              const fat = food.fat ? parseFloat(food.fat) * multiplier : 0;
              return (
                <Box sx={card(d, { p: 2.5, textAlign: 'center' })}>
                  <Typography sx={{
                    fontSize: '2.4rem',
                    fontWeight: 800,
                    color: GOLD,
                    lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {Math.round(cal)}
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: tc.m(d), mt: 0.5 }}>
                    kcal pour {quantity || 0}g
                  </Typography>

                  <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 1.5 }}>
                    {[
                      { label: 'Prot', value: Math.round(prot), color: MACRO_COLORS.protein },
                      { label: 'Gluc', value: Math.round(carbs), color: MACRO_COLORS.carbs },
                      { label: 'Lip', value: Math.round(fat), color: MACRO_COLORS.fat },
                    ].map((m) => (
                      <Stack key={m.label} direction="row" alignItems="center" spacing={0.5}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: m.color, flexShrink: 0 }} />
                        <Typography sx={{ fontSize: '0.65rem', color: tc.m(d) }}>
                          {m.label}
                        </Typography>
                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: tc.h(d), fontVariantNumeric: 'tabular-nums' }}>
                          {m.value}g
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              );
            })()}

            {/* Quantity input */}
            <Box sx={card(d, { p: 2 })}>
              <Box sx={{ position: 'relative' }}>
                <Box
                  component="input"
                  type="number"
                  inputMode="decimal"
                  value={quantity}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuantity(e.target.value)}
                  sx={{
                    width: '100%',
                    py: 1.5,
                    px: 1,
                    textAlign: 'center',
                    borderRadius: '14px',
                    border: '1px solid',
                    borderColor: quantity ? (d ? alpha('#ffffff', 0.12) : alpha('#000000', 0.1)) : (d ? alpha('#ffffff', 0.06) : alpha('#000000', 0.04)),
                    bgcolor: 'transparent',
                    color: tc.h(d),
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    fontFamily: 'inherit',
                    fontVariantNumeric: 'tabular-nums',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    '&:focus': { borderColor: GOLD },
                    '&::placeholder': { color: tc.f(d), fontWeight: 400, fontSize: '0.8rem' },
                    '&::-webkit-inner-spin-button, &::-webkit-outer-spin-button': { WebkitAppearance: 'none', margin: 0 },
                    MozAppearance: 'textfield',
                  }}
                  placeholder="Grammes"
                />
                <Typography sx={{
                  position: 'absolute',
                  right: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '0.7rem',
                  color: tc.f(d),
                  pointerEvents: 'none',
                }}>
                  g
                </Typography>
              </Box>
            </Box>

            {/* Action buttons */}
            <Stack direction="row" spacing={1.5}>
              <Box
                onClick={() => {
                  setFood(null);
                  setState('scanning');
                  setManualBarcode('');
                }}
                sx={{
                  flex: 1,
                  py: 1.5,
                  textAlign: 'center',
                  borderRadius: '14px',
                  border: '1px solid',
                  borderColor: alpha(GOLD, 0.3),
                  color: GOLD,
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  '&:active': { transform: 'scale(0.97)', bgcolor: alpha(GOLD, 0.05) },
                }}
              >
                Re-scanner
              </Box>
              <Box
                onClick={handleConfirmAdd}
                sx={{
                  flex: 2,
                  py: 1.5,
                  textAlign: 'center',
                  bgcolor: GOLD,
                  color: GOLD_CONTRAST,
                  borderRadius: '14px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: `0 4px 16px ${alpha(GOLD, 0.3)}`,
                  '&:active': { transform: 'scale(0.97)' },
                }}
              >
                Ajouter
              </Box>
            </Stack>
          </Stack>
        )}

        {state === 'not-found' && (
          <Stack spacing={2.5} sx={{ textAlign: 'center', py: 6 }}>
            <Box sx={{
              width: 64, height: 64, borderRadius: '50%', mx: 'auto',
              bgcolor: alpha(GOLD, 0.1),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Barcode size={28} weight={W} color={GOLD} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: tc.h(d), mb: 0.5 }}>
                Produit non trouve
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: tc.f(d) }}>
                Ce code-barres n&apos;est pas dans notre base.
              </Typography>
            </Box>
            <Stack spacing={1.5}>
              <Box
                onClick={onSwitchToSearch}
                sx={{
                  py: 1.5,
                  textAlign: 'center',
                  bgcolor: GOLD,
                  color: GOLD_CONTRAST,
                  borderRadius: '14px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
                  boxShadow: `0 4px 16px ${alpha(GOLD, 0.3)}`,
                  '&:active': { transform: 'scale(0.97)' },
                }}
              >
                <MagnifyingGlass size={16} weight={W} />
                Chercher manuellement
              </Box>
              <Box
                onClick={() => {
                  setState('scanning');
                  setManualBarcode('');
                }}
                sx={{
                  py: 1.5,
                  textAlign: 'center',
                  borderRadius: '14px',
                  border: '1px solid',
                  borderColor: alpha(GOLD, 0.3),
                  color: GOLD,
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  '&:active': { transform: 'scale(0.97)', bgcolor: alpha(GOLD, 0.05) },
                }}
              >
                Reessayer
              </Box>
            </Stack>
          </Stack>
        )}
      </Box>
    </Box>
  );
}
