// ============================================================================
// EV Charging Receipt Page
// ============================================================================

import React from "react";
import { Box, Typography, Card, CardContent } from "@mui/material";

export default function EVChargingReceipt() {
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
                EV Charging Receipt
            </Typography>
            <Card>
                <CardContent>
                    <Typography color="text.secondary">EV charging receipt placeholder</Typography>
                </CardContent>
            </Card>
        </Box>
    );
}
