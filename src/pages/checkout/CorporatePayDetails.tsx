// ============================================================================
// CorporatePay Details Page
// ============================================================================

import React from "react";
import { Box, Typography, Card, CardContent } from "@mui/material";

export default function CorporatePayDetails() {
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
                CorporatePay Details
            </Typography>
            <Card>
                <CardContent>
                    <Typography color="text.secondary">CorporatePay details placeholder</Typography>
                </CardContent>
            </Card>
        </Box>
    );
}
