import { Box, CircularProgress, Divider } from '@mui/material';
import { FC, useEffect } from 'react';

import { ServiceNames } from '@/constants/service';
import { CardRoot } from '@/content/DoraMetrics/DoraCards/sharedComponents';
import { useBoolState } from '@/hooks/useEasyState';
import { serviceSlice, ServiceStatusState } from '@/slices/service';
import { useDispatch, useSelector } from '@/store';

import { FlexBox } from '../FlexBox';
import { useOverlayPage } from '../OverlayPageContext';
import { Line } from '../Text';

export const SystemStatus: FC = () => {
  const dispatch = useDispatch();
  const loading = useBoolState(true);

  const services = useSelector(
    (state: { service: { services: ServiceStatusState } }) =>
      state.service.services
  );

  useEffect(() => {
    const eventSource = new EventSource(`/api/stream`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type.includes('status-update')) {
        const statuses = { statuses: data.statuses };
        dispatch(serviceSlice.actions.setStatus(statuses));
        loading.set(false);
      }
      if (data.type.includes('log-update')) {
        const { serviceName, content } = data;

        const newLines = content.split('\n');
        const trimmedLines = newLines.filter(
          (line: string) => line.trim() !== ''
        );

        dispatch(
          serviceSlice.actions.setServiceLogs({
            serviceName,
            serviceLog: trimmedLines
          })
        );
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [dispatch, loading]);

  const { addPage } = useOverlayPage();

  const ServiceTitle: { [key: string]: string } = {
    [ServiceNames.API_SERVER]: 'Backend Server',
    [ServiceNames.REDIS]: 'Redis Database',
    [ServiceNames.POSTGRES]: 'Postgres Database',
    [ServiceNames.SYNC_SERVER]: 'Sync Server'
  };
  return (
    <FlexBox col gap={2} sx={{ padding: '16px' }}>
      <Line bold white fontSize="24px" sx={{ mb: 2 }}>
        System Status
      </Line>
      <Divider sx={{ mb: 2, backgroundColor: 'rgba(255, 255, 255, 0.2)' }} />

      {loading.value ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <CircularProgress color="primary" size={50} />
        </Box>
      ) : (
        <FlexBox col gap={2}>
          {Object.keys(services).map((serviceName) => {
            const ServiceName = serviceName as ServiceNames;
            const { isUp } = services[ServiceName];
            return (
              <CardRoot
                key={serviceName}
                onClick={() => {
                  dispatch(serviceSlice.actions.setActiveService(serviceName));
                  dispatch(serviceSlice.actions.setLoading(true));

                  addPage({
                    page: {
                      ui: 'system_logs',
                      title: `${ServiceTitle[serviceName]} Logs`
                    }
                  });
                }}
                sx={{
                  transition: 'box-shadow 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                  },
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  border: `1px solid ${
                    isUp ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)'
                  }`,
                  padding: '16px',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <FlexBox col flexGrow={1} minHeight="5em">
                  <FlexBox alignCenter justifyContent="space-between">
                    <Line
                      white
                      bold
                      sx={{
                        fontSize: '1.2em',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {ServiceTitle[serviceName]}
                      <Box
                        component="span"
                        sx={{
                          display: 'inline-block',
                          marginLeft: '6px',
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: isUp ? '#28a745' : '#dc3545'
                        }}
                      ></Box>
                    </Line>
                  </FlexBox>

                  <FlexBox col relative fullWidth flexGrow={1}>
                    <FlexBox
                      alignCenter
                      sx={{ width: '100%', paddingTop: '8px' }}
                    >
                      <Line
                        sx={{
                          fontWeight: '500',
                          fontSize: '0.95em',
                          color: isUp ? '#28a745' : '#dc3545',
                          lineHeight: '1.4'
                        }}
                      >
                        {isUp ? 'Status: Healthy' : 'Status: Not Operational'}
                      </Line>
                    </FlexBox>
                  </FlexBox>
                </FlexBox>
              </CardRoot>
            );
          })}
        </FlexBox>
      )}
    </FlexBox>
  );
};
