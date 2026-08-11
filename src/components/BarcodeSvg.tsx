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
}

export function BarcodeSvg({
  value,
  className = '',
  width = 1.3,
  height = 30,
  displayValue = true,
  background = 'transparent',
  lineColor = '#ffffff',
  textColor = '#d1d5db',
}: BarcodeSvgProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: 'CODE128',
          width,
          height,
          displayValue: false,
          margin: 0,
          background,
          lineColor,
        });
      } catch (e) {
        console.warn('JsBarcode render warning:', e);
      }
    }
  }, [value, width, height, background, lineColor]);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg ref={svgRef} className="max-w-full h-auto block" />
      {displayValue && (
        <span
          className="text-[7.5px] font-mono font-black tracking-widest uppercase mt-0.5"
          style={{ color: textColor }}
        >
          ID CREDENCIAL: {value}
        </span>
      )}
    </div>
  );
}

export default BarcodeSvg;
