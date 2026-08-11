import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeSvgProps {
  value: string;
  className?: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
  background?: string;
  lineColor?: string;
  textColor?: string;
  margin?: number;
}

export function BarcodeSvg({
  value,
  className = '',
  width = 1.5,
  height = 38,
  displayValue = true,
  background = '#ffffff',
  lineColor = '#000000',
  textColor = '#000000',
  margin = 12,
}: BarcodeSvgProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const cleanValue = (value || '').trim();

  useEffect(() => {
    if (svgRef.current && cleanValue) {
      try {
        svgRef.current.innerHTML = '';
        JsBarcode(svgRef.current, cleanValue, {
          format: 'CODE128',
          width,
          height,
          displayValue: false,
          margin,
          marginLeft: margin,
          marginRight: margin,
          marginTop: 6,
          marginBottom: 6,
          background,
          lineColor,
          valid: (valid) => {
            if (!valid) {
              console.warn('JsBarcode: invalid Code128 payload', cleanValue);
            }
          },
        });
      } catch (e) {
        console.warn('JsBarcode render warning:', e);
      }
    }
  }, [cleanValue, width, height, background, lineColor, margin]);

  return (
    <div className={`bg-white rounded-lg p-2.5 flex flex-col items-center justify-center border border-neutral-200 shadow-sm text-black ${className}`}>
      <div className="bg-white flex items-center justify-center overflow-hidden w-full">
        <svg
          ref={svgRef}
          className="max-w-full h-auto block mx-auto"
          style={{ shapeRendering: 'crispEdges' }}
        />
      </div>
      {displayValue && (
        <span
          className="text-[8.5px] font-mono font-extrabold tracking-widest uppercase mt-1 select-all text-center text-neutral-900"
          style={{ color: textColor }}
        >
          ID CREDENCIAL: {cleanValue}
        </span>
      )}
    </div>
  );
}

export default BarcodeSvg;

