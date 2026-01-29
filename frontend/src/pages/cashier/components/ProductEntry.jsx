// Updated ProductEntry.jsx with Unit Selection
import React from 'react';
import {FiPackage, FiPlus} from 'react-icons/fi';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

const DIMENSION_UNITS = [
    { value: 'MM', label: 'مليمتر (mm)', conversionToMeters: 0.001 },
    { value: 'CM', label: 'سنتيمتر (cm)', conversionToMeters: 0.01 },
    { value: 'M', label: 'متر (m)', conversionToMeters: 1.0 }
];

const ProductEntry = ({
                          currentLine,
                          glassTypes,
                          onCurrentLineChange,
                          onAddToCart,
                          glassTypeRef,
                          widthRef,
                          heightRef
                      }) => {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                    <FiPackage className="text-green-600" size={20}/>
                </div>
                إضافة منتج
                <span className="text-sm font-normal text-gray-500 mr-auto bg-amber-100 px-3 py-1 rounded-full text-amber-700">
                    Ctrl+Enter للإضافة السريعة
                </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                {/* Glass Type */}
                <Select
                    ref={glassTypeRef}
                    value={currentLine.glassTypeId}
                    onChange={(e) => onCurrentLineChange({
                        ...currentLine,
                        glassTypeId: e.target.value
                    })}
                    placeholder="نوع الزجاج"
                    required
                    options={glassTypes.map((type) => ({
                        value: type.id,
                        label: `${type.nameArabic || type.name} - ${type.thickness}مم`
                    }))}
                />

                {/* Width */}
                <Input
                    ref={widthRef}
                    type="number"
                    placeholder={`العرض (${currentLine.dimensionUnit || 'CM'})`}
                    value={currentLine.width}
                    onChange={(e) => onCurrentLineChange({
                        ...currentLine,
                        width: e.target.value
                    })}
                    onKeyPress={(e) => e.key === 'Enter' && heightRef.current?.focus()}
                    step="0.1"
                    min="0.1"
                    required
                />

                {/* Height */}
                <Input
                    ref={heightRef}
                    type="number"
                    placeholder={`الارتفاع (${currentLine.dimensionUnit || 'CM'})`}
                    value={currentLine.height}
                    onChange={(e) => onCurrentLineChange({
                        ...currentLine,
                        height: e.target.value
                    })}
                    onKeyPress={(e) => e.key === 'Enter' && onAddToCart()}
                    step="0.1"
                    min="0.1"
                    required
                />

                {/* Unit Selection */}
                <Select
                    value={currentLine.dimensionUnit || 'CM'}
                    onChange={(e) => onCurrentLineChange({
                        ...currentLine,
                        dimensionUnit: e.target.value
                    })}
                    options={DIMENSION_UNITS.map(unit => ({
                        value: unit.value,
                        label: unit.label
                    }))}
                />

                {/* Cutting Type */}
                <Select
                    value={currentLine.cuttingType}
                    onChange={(e) => onCurrentLineChange({
                        ...currentLine,
                        cuttingType: e.target.value
                    })}
                    options={[
                        {value: "SHATF", label: "شطف"},
                        {value: "LASER", label: "ليزر"}
                    ]}
                />
            </div>

            {/* Manual Cutting Price for LASER */}
            {currentLine.cuttingType === 'LASER' && (
                <div className="mb-4">
                    <Input
                        type="number"
                        placeholder="سعر القطع اليدوي (اختياري)"
                        value={currentLine.manualCuttingPrice}
                        onChange={(e) => onCurrentLineChange({
                            ...currentLine,
                            manualCuttingPrice: e.target.value
                        })}
                        step="0.01"
                        min="0"
                    />
                </div>
            )}

            <Button
                onClick={onAddToCart}
                disabled={!currentLine.glassTypeId || !currentLine.width || !currentLine.height}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
                <FiPlus className="ml-2"/>
                إضافة للفاتورة
            </Button>
        </div>
    );
};

export default ProductEntry;