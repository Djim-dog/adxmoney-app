            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Instruções de Execução</Label>
              <Textarea
                placeholder="Explique o que o usuário deve fazer..."
                value={newInstructions}
                onChange={(e) => setNewInstructions(e.target.value)}
                className="bg-slate-950 border-slate-800 text-slate-100 text-xs min-h-[80px]"
                required
              />
            </div>

            <div className="pt-2 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateCampaignOpen(false)}
                className="flex-1 border-slate-800 text-slate-400 text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submittingAction}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium"
              >
                {submittingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Criar Campanha"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
