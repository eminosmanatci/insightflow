import { useEffect, useState } from 'react';

import api from '../api';
import {
  EMPTY_KPIS,
  buildDateParams
} from '../utils/dashboard';

const EMPTY_DASHBOARD_DATA = {
  kpis: EMPTY_KPIS,
  regionData: [],
  monthlyData: [],
  categoryData: [],
  productData: [],
  customerData: [],
  growthData: null
};

function isCanceledRequest(error, signal) {
  return (
    error.code === 'ERR_CANCELED' ||
    error.name === 'CanceledError' ||
    signal?.aborted
  );
}

function asArray(value) {
  return Array.isArray(value)
    ? value
    : [];
}

function useDashboardData(appliedFilters) {
  const [dashboardData, setDashboardData] =
    useState(EMPTY_DASHBOARD_DATA);
  const [aiInsight, setAiInsight] =
    useState('');
  const [loading, setLoading] =
    useState(true);
  const [aiLoading, setAiLoading] =
    useState(true);
  const [error, setError] =
    useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchDashboardData() {
      setLoading(true);

      try {
        const params =
          buildDateParams(appliedFilters);

        const hasCompleteDateRange = Boolean(
          appliedFilters.dateFrom &&
            appliedFilters.dateTo
        );

        const growthRequest =
          hasCompleteDateRange
            ? api.get('/analytics/growth', {
                params,
                signal: controller.signal
              })
            : Promise.resolve({
                data: null
              });

        const [
          kpiResponse,
          regionResponse,
          monthlyResponse,
          categoryResponse,
          productResponse,
          customerResponse,
          growthResponse
        ] = await Promise.all([
          api.get('/analytics/kpis', {
            params,
            signal: controller.signal
          }),
          api.get('/analytics/regions', {
            params,
            signal: controller.signal
          }),
          api.get('/analytics/monthly', {
            params,
            signal: controller.signal
          }),
          api.get('/analytics/categories', {
            params,
            signal: controller.signal
          }),
          api.get('/analytics/products', {
            params: {
              ...params,
              limit: 5
            },
            signal: controller.signal
          }),
          api.get('/analytics/customers', {
            params: {
              ...params,
              limit: 5
            },
            signal: controller.signal
          }),
          growthRequest
        ]);

        setDashboardData({
          kpis: {
            total_revenue: Number(
              kpiResponse.data
                ?.total_revenue ?? 0
            ),
            transaction_count: Number(
              kpiResponse.data
                ?.transaction_count ?? 0
            ),
            average_transaction_value:
              Number(
                kpiResponse.data
                  ?.average_transaction_value ??
                  0
              )
          },
          regionData: asArray(
            regionResponse.data
          ),
          monthlyData: asArray(
            monthlyResponse.data
          ),
          categoryData: asArray(
            categoryResponse.data
          ),
          productData: asArray(
            productResponse.data
          ),
          customerData: asArray(
            customerResponse.data
          ),
          growthData:
            growthResponse.data ?? null
        });

        setError(null);
      } catch (requestError) {
        if (
          isCanceledRequest(
            requestError,
            controller.signal
          )
        ) {
          return;
        }

        console.error(
          'Dashboard verileri alınamadı:',
          requestError
        );

        setError(
          requestError.response?.data
            ?.detail ||
            'Dashboard verileri yüklenemedi.'
        );

        setDashboardData({
          ...EMPTY_DASHBOARD_DATA,
          kpis: {
            ...EMPTY_KPIS
          }
        });
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchDashboardData();

    return () => {
      controller.abort();
    };
  }, [appliedFilters]);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchAiInsight() {
      setAiLoading(true);

      try {
        const params =
          buildDateParams(appliedFilters);

        const response = await api.get(
          '/ai/analyze',
          {
            params,
            signal: controller.signal
          }
        );

        setAiInsight(
          response.data?.ai_insight ||
            'Bu dönem için AI içgörüsü bulunamadı.'
        );
      } catch (requestError) {
        if (
          isCanceledRequest(
            requestError,
            controller.signal
          )
        ) {
          return;
        }

        console.error(
          'AI analizi alınamadı:',
          requestError
        );

        setAiInsight(
          'Yapay zeka analiz motoruna şu anda ulaşılamıyor.'
        );
      } finally {
        if (!controller.signal.aborted) {
          setAiLoading(false);
        }
      }
    }

    fetchAiInsight();

    return () => {
      controller.abort();
    };
  }, [appliedFilters]);

  return {
    ...dashboardData,
    aiInsight,
    loading,
    aiLoading,
    error
  };
}

export default useDashboardData;