from pathlib import Path
import re

page_path = Path("app/admin/vehicles/page.tsx")
sql_path = Path("supabase/fleet-edit-partial-and-image-upload.sql")
hardening_path = Path("supabase/fleet-asset-hardening.sql")
guard_path = Path("scripts/production-guard.mjs")

page = page_path.read_text(encoding="utf-8")

old_options = "const fleetImageOptions = [{ label: 'Auto by fleet type', value: '' }, ...jetCarImageOptions, ...jetSkiImageOptions];"
new_options = """function fleetImageOptionsForType(type: string) {
  return [
    { label: 'Auto by fleet type', value: '' },
    ...(type === 'Jet Ski' ? jetSkiImageOptions : jetCarImageOptions)
  ];
}"""
if old_options not in page:
    raise SystemExit("fleet image options marker not found")
page = page.replace(old_options, new_options, 1)

old_upload_end = """  const publicUrl = supabase.storage.from(fleetImageBucket).getPublicUrl(objectPath).data.publicUrl;
  if (!publicUrl) throw new Error('Fleet image uploaded, but its public URL could not be created.');
  return publicUrl;
}"""
new_upload_end = """  const publicUrl = supabase.storage.from(fleetImageBucket).getPublicUrl(objectPath).data.publicUrl;
  if (!publicUrl) throw new Error('Fleet image uploaded, but its public URL could not be created.');
  return { publicUrl, objectPath };
}

async function removeFleetImage(objectPath: string) {
  if (!objectPath) return;
  await supabase.storage.from(fleetImageBucket).remove([objectPath]);
}"""
if old_upload_end not in page:
    raise SystemExit("upload helper marker not found")
page = page.replace(old_upload_end, new_upload_end, 1)

page, count = re.subn(
    r"\nfunction fleetSaveErrorMessage\(message: string\) \{.*?\n\}\n",
    "\n",
    page,
    count=1,
    flags=re.S,
)
if count != 1:
    raise SystemExit(f"fleetSaveErrorMessage removal count={count}")

new_save_function = r"""  async function saveFleet(values: FleetFormValues, imageFile?: File | null) {
    setError('');
    setSuccess('');
    const validationError = validateFleet(values, items, editing?.id);
    if (validationError) return validationError;

    const code = normalizeCode(values.code);
    const name = values.name.trim();
    let uploadedImage: { publicUrl: string; objectPath: string } | null = null;

    if (imageFile) {
      try {
        uploadedImage = await uploadFleetImage(imageFile, code);
      } catch (uploadError) {
        return uploadError instanceof Error ? uploadError.message : 'Unable to upload the fleet image.';
      }
    }

    const imageUrl = uploadedImage?.publicUrl || values.imageUrl.trim() || imagePathFromCode(code, name, values.type);
    const payload = {
      vehicle_code: code,
      vehicle_name: name,
      vehicle_type: typeMap[values.type] || 'jet_car',
      name,
      slug: slugify(code),
      type: typeMap[values.type] || 'jet_car',
      description: values.notes.trim() || `${values.capacity} seater ${values.type} fleet unit.`,
      rental_price_aed_per_hour: 0,
      location: values.location,
      capacity: Number(values.capacity),
      status: statusMap[values.status] || 'available',
      brand: values.brand.trim(),
      model: values.model.trim(),
      year: values.year ? Number(values.year) : null,
      reg_no: normalizeRegistration(values.regNo),
      registration_expiry: values.registrationExpiry || null,
      insurance_number: values.insuranceNumber.trim() || null,
      insurance_expiry: values.insuranceExpiry || null,
      device_imei: normalizeImei(values.deviceImei) || null,
      chassis_vin: values.chassisVin.trim().toUpperCase() || null,
      engine_serial: values.engineSerial.trim().toUpperCase() || null,
      color: values.color.trim(),
      date_of_installation: values.installationDate || null,
      expiry_date: values.registrationExpiry || values.expiryDate || null,
      primary_image_url: imageUrl,
      main_image_url: imageUrl,
      notes: values.notes.trim(),
      sort_order: Number(values.sortOrder || 100),
      is_available: values.status === 'Available',
      is_visible_public: values.status !== 'Retired',
      is_archived: values.status === 'Retired'
    };

    const rpcResult = await supabase.rpc('save_fleet_asset_entry', {
      p_payload: payload,
      p_vehicle_id: editing?.id || null
    });

    if (rpcResult.error) {
      if (uploadedImage) await removeFleetImage(uploadedImage.objectPath);
      if (rpcUnavailable(rpcResult.error.message || '', 'save_fleet_asset_entry')) {
        return 'Fleet save service is temporarily unavailable. Refresh the page and try again.';
      }
      return rpcResult.error.message || 'Unable to save the fleet unit.';
    }

    const wasEditing = Boolean(editing);
    setFormOpen(false);
    setEditing(null);
    setSuccess(wasEditing ? 'Fleet unit updated successfully.' : 'Fleet unit created successfully.');
    await loadFleet();
    return '';
  }

"""
page, count = re.subn(
    r"  async function saveFleet\(values: FleetFormValues, imageFile\?: File \| null\) \{.*?\n  async function applyStatusAction",
    new_save_function + "  async function applyStatusAction",
    page,
    count=1,
    flags=re.S,
)
if count != 1:
    raise SystemExit(f"saveFleet replacement count={count}")

new_modal = r"""function FleetFormModal({ initialValues, onClose, onSubmit }: { initialValues?: FleetRecord; onClose: () => void; onSubmit: (values: FleetFormValues, imageFile?: File | null) => Promise<string> }) {
  const [values, setValues] = useState<FleetFormValues>(initialValues ? { ...initialValues } : emptyFleet);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const issues = initialValues ? complianceIssues({ ...initialValues, ...values, imageUrl: imagePreview || values.imageUrl }) : [];
  const imageOptions = fleetImageOptionsForType(values.type);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview('');
      return;
    }
    const previewUrl = URL.createObjectURL(imageFile);
    setImagePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [imageFile]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const message = await onSubmit(values, imageFile);
      if (message) setFormError(message);
    } finally {
      setSaving(false);
    }
  }

  function updateField<K extends keyof FleetFormValues>(name: K, value: FleetFormValues[K]) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  function updateType(value: string) {
    setImageFile(null);
    setValues((current) => {
      const galleryImage = current.imageUrl.startsWith(fleetBasePath);
      return {
        ...current,
        type: value,
        capacity: value === 'Jet Ski' ? '2' : '4',
        imageUrl: galleryImage ? imagePathFromCode(current.code, current.name, value) : current.imageUrl
      };
    });
  }

  function selectImage(file: File | null) {
    if (!file) {
      setImageFile(null);
      return;
    }
    if (!allowedFleetImageTypes.has(file.type)) {
      setFormError('Fleet image must be JPG, PNG, or WebP.');
      return;
    }
    if (file.size > maxFleetImageBytes) {
      setFormError('Fleet image must be 5 MB or smaller.');
      return;
    }
    setFormError('');
    setImageFile(file);
  }

  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-primary-900/35 p-4 backdrop-blur-sm">
    <div className="flex max-h-[94vh] w-full max-w-[54rem] flex-col overflow-hidden rounded-[1.6rem] border border-white/80 bg-white shadow-[0_28px_80px_rgba(8,37,50,0.28)]">
      <div className="flex items-start justify-between gap-4 border-b border-border/70 bg-[#F7FAFA] px-5 py-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Fleet Asset Profile</p>
          <h2 className="mt-1 font-heading text-xl font-semibold text-foreground">{initialValues ? 'Edit Fleet Unit' : 'Add Fleet Unit'}</h2>
          {initialValues ? <p className="mt-1 text-xs font-medium text-muted-foreground">{issues.length ? `Profile incomplete · ${issues.length} detail${issues.length === 1 ? '' : 's'} can be completed later.` : 'Fleet profile is complete.'}</p> : <p className="mt-1 text-xs font-medium text-muted-foreground">Create the core fleet record first. Additional details can be added later.</p>}
        </div>
        <button type="button" onClick={onClose} className="flex size-9 items-center justify-center rounded-full border border-border bg-white text-muted-foreground transition hover:text-primary"><X className="size-4" aria-hidden="true" /></button>
      </div>

      <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
        <div className="grid min-h-0 gap-4 overflow-y-auto px-5 py-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-white p-4">
              <SectionTitle title="Core Fleet Details" />
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <FormInput label="Fleet Code *" value={values.code} required placeholder="JC-0001 / JS-0001" maxLength={40} onChange={(value) => updateField('code', value)} />
                <FormInput label="Vehicle Name *" value={values.name} required maxLength={120} onChange={(value) => updateField('name', value)} />
                <SelectInput label="Vehicle Type *" value={values.type} options={Object.keys(typeMap)} required onChange={updateType} />
                <FormInput label={initialValues ? 'Registration Number' : 'Registration Number *'} value={values.regNo} required={!initialValues} maxLength={40} placeholder={initialValues ? 'Add when available' : 'Required and unique'} onChange={(value) => updateField('regNo', value)} />
                <SelectInput label="Location *" value={values.location} options={locations} required onChange={(value) => updateField('location', value)} />
                <FormInput label="Capacity / Seater *" type="number" value={values.capacity} required min="1" max="12" onChange={(value) => updateField('capacity', value)} />
                <SelectInput label="Status *" value={values.status} options={Object.keys(statusMap)} required onChange={(value) => updateField('status', value)} />
              </div>
            </div>

            <details className="group rounded-2xl border border-border bg-white">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-foreground">
                Additional vehicle details
                <span className="text-xs font-semibold text-muted-foreground group-open:hidden">Optional</span>
                <span className="hidden text-xs font-semibold text-primary group-open:inline">Hide</span>
              </summary>
              <div className="grid gap-3 border-t border-border/70 p-4 sm:grid-cols-2">
                <FormInput label="Registration Expiry" type="date" value={values.registrationExpiry} onChange={(value) => updateField('registrationExpiry', value)} />
                <FormInput label="Insurance Number" value={values.insuranceNumber} maxLength={80} onChange={(value) => updateField('insuranceNumber', value)} />
                <FormInput label="Insurance Expiry" type="date" value={values.insuranceExpiry} onChange={(value) => updateField('insuranceExpiry', value)} />
                <FormInput label="Tracker IMEI" value={values.deviceImei} inputMode="numeric" maxLength={20} onChange={(value) => updateField('deviceImei', value)} />
                <FormInput label="Chassis / VIN" value={values.chassisVin} maxLength={80} onChange={(value) => updateField('chassisVin', value)} />
                <FormInput label="Engine / Serial Number" value={values.engineSerial} maxLength={80} onChange={(value) => updateField('engineSerial', value)} />
                <FormInput label="Brand" value={values.brand} maxLength={80} onChange={(value) => updateField('brand', value)} />
                <FormInput label="Model" value={values.model} maxLength={80} onChange={(value) => updateField('model', value)} />
                <FormInput label="Year" type="number" value={values.year} min="1990" max={String(new Date().getFullYear() + 1)} onChange={(value) => updateField('year', value)} />
                <FormInput label="Color" value={values.color} maxLength={60} onChange={(value) => updateField('color', value)} />
                <FormInput label="Date of Installation" type="date" value={values.installationDate} onChange={(value) => updateField('installationDate', value)} />
                <FormInput label="Display Order" type="number" value={values.sortOrder} min="0" max="9999" onChange={(value) => updateField('sortOrder', value)} />
                <label className="grid gap-1.5 text-sm font-semibold text-foreground sm:col-span-2">Notes<textarea maxLength={2000} value={values.notes} onChange={(event) => updateField('notes', event.target.value)} className="min-h-24 rounded-xl border border-border bg-white px-3 py-3 text-sm text-foreground outline-none focus:border-primary" /></label>
              </div>
            </details>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-[#F7FAFA] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Current Image</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">JPG, PNG or WebP · maximum 5 MB</p>
                </div>
                <ImageIcon className="size-4 text-muted-foreground" aria-hidden="true" />
              </div>
              <div className="mt-3 overflow-hidden rounded-2xl bg-white p-3">
                <img src={imagePreview || values.imageUrl || imagePathFromCode(values.code, values.name, values.type)} alt={values.name || 'Fleet preview'} className="h-48 w-full rounded-xl object-contain" />
              </div>
              <label className="mt-3 flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary-50 text-sm font-bold text-primary transition hover:border-primary hover:bg-primary-100">
                <Upload className="size-4" aria-hidden="true" />
                {imageFile ? 'Choose a different image' : 'Replace image'}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { selectImage(event.currentTarget.files?.[0] || null); event.currentTarget.value = ''; }} />
              </label>
              {imageFile ? <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2"><span className="min-w-0 truncate text-xs font-semibold text-emerald-800">Selected: {imageFile.name}</span><button type="button" onClick={() => setImageFile(null)} className="shrink-0 text-xs font-bold text-emerald-800 hover:underline">Remove</button></div> : <p className="mt-2 text-xs leading-5 text-muted-foreground">The current image stays unchanged unless you select a replacement.</p>}

              <details className="group mt-4 border-t border-border/70 pt-3">
                <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-bold text-primary">
                  Advanced image options
                  <span className="text-muted-foreground group-open:hidden">Show</span>
                  <span className="hidden text-muted-foreground group-open:inline">Hide</span>
                </summary>
                <div className="mt-3 space-y-3">
                  <label className="grid gap-1.5 text-sm font-semibold text-foreground">Choose from {values.type} gallery
                    <select value={values.imageUrl} onChange={(event) => { setImageFile(null); updateField('imageUrl', event.target.value); }} className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm">
                      {imageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>
                  <FormInput label="Custom Image URL / Path" value={values.imageUrl} placeholder="/images/edrive/fleet/jc-01.webp or https://..." onChange={(value) => { setImageFile(null); updateField('imageUrl', value); }} />
                </div>
              </details>
            </div>

            {initialValues && issues.length ? <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold leading-5 text-amber-800"><AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><span>{issues.length} profile check{issues.length === 1 ? '' : 's'} remain. They do not block saving this edit.</span></div> : null}
          </div>
        </div>

        {formError ? <p className="mx-5 mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{formError}</p> : null}
        <div className="flex justify-end gap-3 border-t border-border/70 bg-white px-5 py-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Fleet Unit'}</Button>
        </div>
      </form>
    </div>
  </div>;
}

"""
page, count = re.subn(
    r"function FleetFormModal\(\{ initialValues, onClose, onSubmit \}:.*?\nfunction SectionTitle",
    new_modal + "function SectionTitle",
    page,
    count=1,
    flags=re.S,
)
if count != 1:
    raise SystemExit(f"FleetFormModal replacement count={count}")

page_path.write_text(page, encoding="utf-8")

for path in (sql_path, hardening_path):
    sql = path.read_text(encoding="utf-8")
    before = sql
    sql = sql.replace(
        "v_code, v_name, v_type::public.vehicle_type, v_name, lower(v_code), v_type,",
        "v_code, v_name, v_type::public.vehicle_type, v_name, lower(v_code), v_type::public.vehicle_type,",
    )
    sql = sql.replace(
        "        type = v_type,",
        "        type = v_type::public.vehicle_type,",
    )
    if sql == before:
        raise SystemExit(f"enum type column cast markers not found in {path}")
    path.write_text(sql, encoding="utf-8")

sql_source = sql_path.read_text(encoding="utf-8")
start = sql_source.index("create or replace function public.save_fleet_asset_entry(")
end = sql_source.index("\nrevoke all on function public.save_fleet_asset_entry", start)
save_function = sql_source[start:end]
final_sql = f"""-- Final eDrive Fleet edit enum correction.
-- Run once in Supabase SQL Editor. Safe to rerun.
-- This fixes the legacy `type` column when it also uses public.vehicle_type.

begin;

{save_function}

revoke all on function public.save_fleet_asset_entry(jsonb, uuid) from public;
grant execute on function public.save_fleet_asset_entry(jsonb, uuid) to authenticated;

commit;

notify pgrst, 'reload schema';
"""
Path("supabase/fleet-edit-final-enum-fix.sql").write_text(final_sql, encoding="utf-8")

guard = guard_path.read_text(encoding="utf-8")
guard = guard.replace(
    "const fleetEditMigration = read('supabase/fleet-edit-partial-and-image-upload.sql');",
    "const fleetEditMigration = read('supabase/fleet-edit-partial-and-image-upload.sql');\nconst fleetEditFinalMigration = read('supabase/fleet-edit-final-enum-fix.sql');",
)
guard = guard.replace(
    "assert(fleetPage.includes('Upload fleet image'), 'Fleet edit form must expose image upload.');",
    "assert(fleetPage.includes('Replace image'), 'Fleet edit form must expose a simple replacement image action.');\nassert(fleetPage.includes('Advanced image options'), 'Gallery and custom image fields must stay collapsed by default.');\nassert(fleetPage.includes('fleetImageOptionsForType'), 'Fleet image gallery must be filtered by vehicle type.');\nassert(fleetPage.includes('removeFleetImage'), 'Failed fleet saves must clean up newly uploaded images.');\nassert(!fleetPage.includes('Fleet database enum fix is pending'), 'Fleet edit must not show the obsolete migration-pending message.');",
)
guard = guard.replace(
    "assert(fleetEditMigration.includes('v_type::public.vehicle_type'), 'Fleet save RPC must cast vehicle_type text to its enum.');",
    "assert(fleetEditMigration.includes('v_type::public.vehicle_type'), 'Fleet save RPC must cast vehicle_type text to its enum.');\nassert(fleetEditMigration.includes('type = v_type::public.vehicle_type'), 'Fleet save RPC must cast the legacy type column when it uses the vehicle_type enum.');\nassert(fleetEditFinalMigration.includes('type = v_type::public.vehicle_type'), 'Final fleet enum rollout must include the legacy type-column cast.');",
)
guard_path.write_text(guard, encoding="utf-8")
