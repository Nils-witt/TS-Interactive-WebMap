import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import {
  einheiten,
  type EinheitId,
  erzeugeTaktischesZeichen,
  type FachaufgabeId,
  fachaufgaben,
  grundzeichen,
  type GrundzeichenId,
  organisationen,
  type OrganisationId,
  symbole,
  type SymbolId,
  type VerwaltungsstufeId,
  verwaltungsstufen,
  type TaktischesZeichen,
} from 'taktische-zeichen-core';
import { useEffect, useMemo, useState } from 'react';
import { ApplicationLogger } from '../ApplicationLogger.ts';

export interface EditIconDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (entity: TaktischesZeichen) => void;
  entity: TaktischesZeichen | undefined | null;
  unitName: string | undefined;
}

export function EditIconDialog(props: EditIconDialogProps) {
  const [grundzeichenId, setGrundzeichenId] =
    useState<GrundzeichenId>('fahrzeug');
  const [fachaufgabeId, setFachaufgabeId] = useState<FachaufgabeId | ''>('');
  const [organisationId, setOrganisationId] = useState<OrganisationId | ''>('');
  const [einheitId, setEinheitId] = useState<EinheitId | ''>('');
  const [verwaltungsStufeId, setVerwaltungsStufeId] = useState<
    VerwaltungsstufeId | ''
  >('');
  const [symbolId, setSymbolId] = useState<SymbolId | ''>('');

  const [name, setName] = useState<string>('');
  const [text, setText] = useState<string>('');
  const [orgName, setOrgName] = useState<string>('');
  const [typ, setTyp] = useState<string>('');

  const getTaktischesZeichen: () => TaktischesZeichen = () => {
    return {
      grundzeichen: grundzeichenId,
      fachaufgabe: fachaufgabeId != '' ? fachaufgabeId : undefined,
      organisation: organisationId != '' ? organisationId : undefined,
      einheit: einheitId != '' ? einheitId : undefined,
      verwaltungsstufe:
        verwaltungsStufeId != '' ? verwaltungsStufeId : undefined,
      symbol: symbolId != '' ? symbolId : undefined,
      name: name,
      text: text,
      organisationName: orgName,
      typ: typ,
    };
  };

  const imgSrc = useMemo(() => {
    try {
      const tz = erzeugeTaktischesZeichen(getTaktischesZeichen());
      const dataUrl = `data:image/svg+xml;base64,${btoa(tz.toString())}`;

      return dataUrl;
    } catch (e) {
      ApplicationLogger.error(
        'Error generating icon element for Unit: ' + (e as Error).message,
        { service: 'Unit' },
      );
      return '';
    }
  }, [
    grundzeichenId,
    fachaufgabeId,
    organisationId,
    einheitId,
    verwaltungsStufeId,
    symbolId,
    name,
    text,
    orgName,
    typ,
  ]);

  const save = () => {
    props.onSave(getTaktischesZeichen());
    props.onClose();
  };

  useEffect(() => {
    setGrundzeichenId(props.entity?.grundzeichen || 'fahrzeug');
    setFachaufgabeId(props.entity?.fachaufgabe || '');
    setOrganisationId(props.entity?.organisation || '');
    setEinheitId(props.entity?.einheit || '');
    setVerwaltungsStufeId(props.entity?.verwaltungsstufe || '');
    setSymbolId(props.entity?.symbol || '');
    setName(props.entity?.name || '');
    setText(props.entity?.text || '');
    setOrgName(props.entity?.organisationName || '');
    setTyp(props.entity?.typ || '');
  }, [props.entity]);

  return (
    <Dialog open={props.open} onClose={props.onClose} fullWidth maxWidth="xs">
      <DialogTitle>
        Edit Unit symbol: {props.unitName}
        <br />
        <img src={imgSrc} style={{ maxHeight: '80px' }} />
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            pt: '16px !important',
          }}
        >
          <FormControl fullWidth size="small">
            <InputLabel>Grundzeichen</InputLabel>
            <Select
              label="Grundzeichen"
              value={grundzeichenId}
              onChange={(e) => setGrundzeichenId(e.target.value)}
            >
              {grundzeichen.map((gz) => {
                return (
                  <MenuItem key={gz.id} value={gz.id}>
                    {gz.label}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>Fachaufgabe</InputLabel>
            <Select
              label="Fachaufgabe"
              value={fachaufgabeId}
              onChange={(e) => setFachaufgabeId(e.target.value)}
            >
              <MenuItem value={''}>
                <em>None</em>
              </MenuItem>
              {fachaufgaben.map((fa) => {
                return (
                  <MenuItem key={fa.id} value={fa.id}>
                    {fa.label}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>Organisation</InputLabel>
            <Select
              label="Organisation"
              value={organisationId}
              onChange={(e) => setOrganisationId(e.target.value)}
            >
              <MenuItem value={''}>
                <em>None</em>
              </MenuItem>
              {organisationen.map((fa) => {
                return (
                  <MenuItem key={fa.id} value={fa.id}>
                    {fa.label}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>Einheit</InputLabel>
            <Select
              label="Einheit"
              value={einheitId}
              onChange={(e) => setEinheitId(e.target.value)}
            >
              <MenuItem value={''}>
                <em>None</em>
              </MenuItem>
              {einheiten.map((fa) => {
                return (
                  <MenuItem key={fa.id} value={fa.id}>
                    {fa.label}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>Verwaltungsstufe</InputLabel>
            <Select
              label="Verwaltungsstufe"
              value={verwaltungsStufeId}
              onChange={(e) => setVerwaltungsStufeId(e.target.value)}
            >
              <MenuItem value={''}>
                <em>None</em>
              </MenuItem>
              {verwaltungsstufen.map((fa) => {
                return (
                  <MenuItem key={fa.id} value={fa.id}>
                    {fa.label}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>Symbol</InputLabel>
            <Select
              label="Symbol"
              value={symbolId}
              onChange={(e) => setSymbolId(e.target.value)}
            >
              <MenuItem value={''}>
                <em>None</em>
              </MenuItem>
              {symbole.map((fa) => {
                return (
                  <MenuItem key={fa.id} value={fa.id}>
                    {fa.label}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          <TextField
            label="Text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            fullWidth
            size="small"
          />

          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            size="small"
          />

          <TextField
            label="Organisationsname"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            fullWidth
            size="small"
          />

          <TextField
            label="Typ"
            value={typ}
            onChange={(e) => setTyp(e.target.value)}
            fullWidth
            size="small"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Cancel</Button>
        <Button variant="contained" onClick={save}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
