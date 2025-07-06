
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { STANDARDIZED_FEE_TYPES, isValidFeeType, getFeeTypeLabel } from '@/constants/feeTypes';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface ValidationResult {
  table: string;
  validTypes: string[];
  invalidTypes: string[];
  totalRecords: number;
}

export function FeeTypeValidator() {
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showValidator, setShowValidator] = useState(false);

  const validateFeeTypes = async () => {
    setLoading(true);
    const validationResults: ValidationResult[] = [];

    try {
      // Check student_fee_records table
      const { data: studentFeeData, error: studentFeeError } = await supabase
        .from('student_fee_records')
        .select('fee_type');
      
      if (!studentFeeError && studentFeeData) {
        const feeTypes = [...new Set(studentFeeData.map(f => f.fee_type))];
        const valid = feeTypes.filter(isValidFeeType);
        const invalid = feeTypes.filter(type => !isValidFeeType(type));
        
        validationResults.push({
          table: 'student_fee_records',
          validTypes: valid,
          invalidTypes: invalid,
          totalRecords: studentFeeData.length
        });
      }

      // Check fee_structures table
      const { data: structuresData, error: structuresError } = await supabase
        .from('fee_structures')
        .select('fee_type');
      
      if (!structuresError && structuresData) {
        const feeTypes = [...new Set(structuresData.map(f => f.fee_type))];
        const valid = feeTypes.filter(isValidFeeType);
        const invalid = feeTypes.filter(type => !isValidFeeType(type));
        
        validationResults.push({
          table: 'fee_structures',
          validTypes: valid,
          invalidTypes: invalid,
          totalRecords: structuresData.length
        });
      }

      // Check discount_history table
      const { data: discountData, error: discountError } = await supabase
        .from('discount_history')
        .select('reason')
        .not('reason', 'is', null);
      
      if (!discountError && discountData) {
        // For discount history, we check the reason field which might contain fee types
        const reasons = [...new Set(discountData.map(d => d.reason))];
        const feeTypeReasons = reasons.filter(reason => 
          STANDARDIZED_FEE_TYPES.some(feeType => reason.toLowerCase().includes(feeType.toLowerCase()))
        );
        
        validationResults.push({
          table: 'discount_history',
          validTypes: feeTypeReasons,
          invalidTypes: [],
          totalRecords: discountData.length
        });
      }

      // Check fee_payment_records table - no fee_type column, so we skip this
      const { data: paymentData, error: paymentError } = await supabase
        .from('fee_payment_records')
        .select('id')
        .limit(1);
      
      if (!paymentError && paymentData) {
        validationResults.push({
          table: 'fee_payment_records',
          validTypes: ['No fee_type validation needed'],
          invalidTypes: [],
          totalRecords: paymentData.length
        });
      }

      setResults(validationResults);
    } catch (error) {
      console.error('Validation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getValidationIcon = (result: ValidationResult) => {
    if (result.invalidTypes.length === 0) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    } else if (result.validTypes.length > 0) {
      return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    } else {
      return <XCircle className="w-5 h-5 text-red-600" />;
    }
  };

  const getValidationStatus = (result: ValidationResult) => {
    if (result.invalidTypes.length === 0) {
      return { text: 'All Valid', color: 'bg-green-100 text-green-800' };
    } else if (result.validTypes.length > 0) {
      return { text: 'Partially Valid', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { text: 'Invalid Types Found', color: 'bg-red-100 text-red-800' };
    }
  };

  // Only show validator in development or when explicitly enabled
  if (!showValidator && process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="space-y-4">
      {!showValidator && (
        <Button 
          variant="outline" 
          onClick={() => setShowValidator(true)}
          className="mb-4"
        >
          Show Fee Type Validator
        </Button>
      )}
      
      {showValidator && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>Fee Type Validation</span>
              <Button 
                onClick={validateFeeTypes} 
                disabled={loading}
                size="sm"
              >
                {loading ? 'Validating...' : 'Run Validation'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Standardized Fee Types:</h4>
                <div className="grid grid-cols-2 gap-1">
                  {STANDARDIZED_FEE_TYPES.map(type => (
                    <Badge key={type} variant="outline" className="text-xs">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {results.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Validation Results:</h4>
                {results.map(result => {
                  const status = getValidationStatus(result);
                  return (
                    <div key={result.table} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getValidationIcon(result)}
                          <span className="font-medium capitalize">{result.table}</span>
                          <Badge className={status.color}>
                            {status.text}
                          </Badge>
                        </div>
                        <span className="text-sm text-gray-500">
                          {result.totalRecords} records
                        </span>
                      </div>
                      
                      {result.validTypes.length > 0 && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-green-700">Valid Types:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {result.validTypes.map(type => (
                              <Badge key={type} className="bg-green-100 text-green-800 text-xs">
                                {type}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {result.invalidTypes.length > 0 && (
                        <div>
                          <span className="text-sm font-medium text-red-700">Invalid Types:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {result.invalidTypes.map(type => (
                              <Badge key={type} className="bg-red-100 text-red-800 text-xs">
                                {type}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
